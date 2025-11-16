using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HouseSpend.API.Data;
using HouseSpend.API.DTOs;
using HouseSpend.API.Models;
using HouseSpend.API.Services;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HouseSpend.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly HouseSpendDbContext _context;
    private readonly IAnalysisService _analysisService;
    private readonly ILogger<TicketsController> _logger;

    public TicketsController(
        HouseSpendDbContext context,
        IAnalysisService analysisService,
        ILogger<TicketsController> logger)
    {
        _context = context;
        _analysisService = analysisService;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    [HttpPost("upload")]
    public async Task<ActionResult<TicketDto>> UploadTicket(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No se proporcionó ningún archivo" });
        }

        // Validar tipo de archivo
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg", "application/pdf" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
        {
            return BadRequest(new { message = "Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG) y PDF" });
        }

        // Validar tamaño (máximo 10MB)
        if (file.Length > 10 * 1024 * 1024)
        {
            return BadRequest(new { message = "El archivo es demasiado grande. Máximo 10MB" });
        }

        byte[] imageData;
        using (var memoryStream = new MemoryStream())
        {
            await file.CopyToAsync(memoryStream);
            imageData = memoryStream.ToArray();
        }

        var ticket = new Ticket
        {
            UserId = GetCurrentUserId(),
            ImageData = imageData,
            ImageContentType = file.ContentType,
            CreatedAt = DateTime.UtcNow
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        // Análisis automático del comercio en segundo plano (no bloquea la respuesta)
        _ = Task.Run(async () =>
        {
            try
            {
                var storeName = await _analysisService.ExtractStoreNameAsync(
                    ticket.ImageData!,
                    ticket.ImageContentType ?? "image/jpeg");

                if (!string.IsNullOrEmpty(storeName))
                {
                    // Actualizar el ticket con el nombre del comercio
                    var ticketToUpdate = await _context.Tickets.FindAsync(ticket.Id);
                    if (ticketToUpdate != null)
                    {
                        ticketToUpdate.StoreName = storeName;
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("Comercio extraído automáticamente para ticket {TicketId}: {StoreName}", ticket.Id, storeName);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error al extraer comercio automáticamente para ticket {TicketId}", ticket.Id);
                // No lanzar excepción, el ticket ya está guardado
            }
        });

        return Ok(new TicketDto
        {
            Id = ticket.Id,
            StoreName = ticket.StoreName,
            TotalAmount = ticket.TotalAmount,
            PurchaseDate = ticket.PurchaseDate,
            IsAnalyzed = ticket.IsAnalyzed,
            CreatedAt = ticket.CreatedAt,
            ProductCount = 0
        });
    }

    [HttpPost("{id}/analyze")]
    public async Task<ActionResult<TicketDetailDto>> AnalyzeTicket(int id)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Products)
            .ThenInclude(p => p.Category)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == GetCurrentUserId());

        if (ticket == null)
        {
            return NotFound();
        }

        if (ticket.ImageData == null)
        {
            return BadRequest(new { message = "El ticket no tiene imagen" });
        }

        try
        {
            var analysisResult = await _analysisService.AnalyzeTicketAsync(
                ticket.ImageData,
                ticket.ImageContentType ?? "image/jpeg"
            );

            var validationWarnings = new List<string>();
            var analyzedProducts = analysisResult.Products ?? new List<ProductAnalysis>();

            // Obtener categorías para mapeo
            var categories = await _context.Categories.ToListAsync();
            var categoryDict = categories.ToDictionary(c => c.Name, c => c);

            var productsToPersist = new List<Product>();
            foreach (var productAnalysis in analyzedProducts)
            {
                var validation = ValidateProductAnalysis(productAnalysis);
                if (!validation.IsValid)
                {
                    validationWarnings.Add(validation.Warning);
                    continue;
                }

                var category = productAnalysis.CategoryName != null
                    ? categoryDict.GetValueOrDefault(productAnalysis.CategoryName)
                    : categoryDict.GetValueOrDefault("Otros");

                var quantity = Math.Round(productAnalysis.Quantity, 3, MidpointRounding.AwayFromZero);
                var unitPrice = Math.Round(productAnalysis.UnitPrice, 2, MidpointRounding.AwayFromZero);
                var totalPrice = Math.Round(productAnalysis.TotalPrice, 2, MidpointRounding.AwayFromZero);

                if (totalPrice <= 0 && unitPrice > 0 && quantity > 0)
                {
                    totalPrice = Math.Round(unitPrice * quantity, 2, MidpointRounding.AwayFromZero);
                }
                else if (unitPrice <= 0 && totalPrice > 0 && quantity > 0)
                {
                    unitPrice = Math.Round(totalPrice / quantity, 2, MidpointRounding.AwayFromZero);
                }

                var product = new Product
                {
                    TicketId = ticket.Id,
                    Name = productAnalysis.Name.Trim(),
                    Quantity = quantity,
                    UnitPrice = unitPrice,
                    TotalPrice = totalPrice,
                    CategoryId = category?.Id,
                    IsDiscount = productAnalysis.IsDiscount,
                    CreatedAt = DateTime.UtcNow
                };

                productsToPersist.Add(product);
            }

            if (!productsToPersist.Any())
            {
                ticket.IsAnalyzed = false;
                ticket.TotalAmount = null;
                ticket.PurchaseDate = null;
                ticket.StoreName = null;

                await _context.SaveChangesAsync();

                return UnprocessableEntity(new
                {
                    message = "No se encontraron productos válidos en el análisis. Intenta nuevamente o sube una imagen más clara.",
                    warnings = validationWarnings
                });
            }

            // Actualizar ticket con información extraída
            ticket.StoreName = string.IsNullOrWhiteSpace(analysisResult.StoreName)
                ? ticket.StoreName
                : analysisResult.StoreName;
            ticket.TotalAmount = analysisResult.TotalAmount >= 0
                ? analysisResult.TotalAmount
                : productsToPersist.Sum(p => p.TotalPrice);
            ticket.PurchaseDate = analysisResult.PurchaseDate;
            ticket.IsAnalyzed = true;

            // Eliminar productos anteriores si existen
            _context.Products.RemoveRange(ticket.Products);
            foreach (var product in productsToPersist)
            {
                _context.Products.Add(product);
            }

            await _context.SaveChangesAsync();

            if (validationWarnings.Any())
            {
                Response.Headers.Append("X-Analysis-Warnings", string.Join("|", validationWarnings));
            }

            // Actualizar stock automáticamente para cada producto
            await UpdateStockFromProducts(ticket.Id, productsToPersist);

            // Recargar ticket con productos
            ticket = await _context.Tickets
                .Include(t => t.Products)
                .ThenInclude(p => p.Category)
                .FirstOrDefaultAsync(t => t.Id == id);

            return Ok(MapToTicketDetailDto(ticket!));
        }
        catch (AnalysisException ex)
        {
            _logger.LogWarning(ex, "Error controlado al analizar el ticket {TicketId}", id);
            return StatusCode(ex.StatusCode, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al analizar el ticket {TicketId}", id);
            return StatusCode(500, new { message = "Error inesperado al analizar el ticket. Intenta nuevamente." });
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<TicketDto>>> GetTickets()
    {
        var tickets = await _context.Tickets
            .Where(t => t.UserId == GetCurrentUserId())
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TicketDto
            {
                Id = t.Id,
                StoreName = t.StoreName,
                TotalAmount = t.TotalAmount,
                PurchaseDate = t.PurchaseDate,
                IsAnalyzed = t.IsAnalyzed,
                CreatedAt = t.CreatedAt,
                ProductCount = t.Products.Count
            })
            .ToListAsync();

        return Ok(tickets);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TicketDetailDto>> GetTicket(int id)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Products)
            .ThenInclude(p => p.Category)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == GetCurrentUserId());

        if (ticket == null)
        {
            return NotFound();
        }

        return Ok(MapToTicketDetailDto(ticket));
    }

    [HttpGet("{id}/image")]
    public async Task<ActionResult> GetTicketImage(int id)
    {
        var ticket = await _context.Tickets
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == GetCurrentUserId());

        if (ticket == null || ticket.ImageData == null)
        {
            return NotFound();
        }

        return File(ticket.ImageData, ticket.ImageContentType ?? "image/jpeg");
    }

    private async Task UpdateStockFromProducts(int ticketId, List<Product> products)
    {
        var userId = GetCurrentUserId();

        foreach (var product in products)
        {
            try
            {
                // Buscar si ya existe un item de stock con el mismo nombre para este usuario
                var stockItem = await _context.StockItems
                    .FirstOrDefaultAsync(s => s.UserId == userId && 
                        s.ProductName.ToLower() == product.Name.ToLower());

                if (stockItem == null)
                {
                    // Crear nuevo item de stock
                    stockItem = new StockItem
                    {
                        UserId = userId,
                        ProductName = product.Name,
                        CategoryId = product.CategoryId,
                        CurrentQuantity = product.Quantity,
                        Unit = "unidad", // Por defecto, se puede mejorar extrayendo la unidad del análisis
                        LastUpdated = DateTime.UtcNow
                    };
                    _context.StockItems.Add(stockItem);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    // Actualizar cantidad existente
                    stockItem.CurrentQuantity += product.Quantity;
                    stockItem.LastUpdated = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                // Crear transacción de compra
                var transaction = new StockTransaction
                {
                    StockItemId = stockItem.Id,
                    TicketId = ticketId,
                    TransactionType = TransactionType.Purchase,
                    Quantity = product.Quantity,
                    Date = DateTime.UtcNow,
                    Notes = $"Compra desde ticket #{ticketId}"
                };
                _context.StockTransactions.Add(transaction);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error al actualizar stock para producto {ProductName} del ticket {TicketId}", 
                    product.Name, ticketId);
                // Continuar con el siguiente producto aunque falle uno
            }
        }

        await _context.SaveChangesAsync();
    }

    private TicketDetailDto MapToTicketDetailDto(Ticket ticket)
    {
        return new TicketDetailDto
        {
            Id = ticket.Id,
            StoreName = ticket.StoreName,
            TotalAmount = ticket.TotalAmount,
            PurchaseDate = ticket.PurchaseDate,
            IsAnalyzed = ticket.IsAnalyzed,
            CreatedAt = ticket.CreatedAt,
            Products = ticket.Products.Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Quantity = p.Quantity,
                UnitPrice = p.UnitPrice,
                TotalPrice = p.TotalPrice,
                Category = p.Category != null ? new CategoryDto
                {
                    Id = p.Category.Id,
                    Name = p.Category.Name,
                    Description = p.Category.Description,
                    Color = p.Category.Color
                } : null,
                IsDiscount = p.IsDiscount
            }).ToList()
        };
    }

    private (bool IsValid, string Warning) ValidateProductAnalysis(ProductAnalysis product)
    {
        if (product == null)
        {
            return (false, "Producto inválido retornado por el análisis.");
        }

        if (string.IsNullOrWhiteSpace(product.Name))
        {
            return (false, "Se descartó un producto sin nombre.");
        }

        if (product.Quantity <= 0)
        {
            return (false, $"Se descartó '{product.Name}' por cantidad inválida ({product.Quantity}).");
        }

        if (product.UnitPrice < 0 || product.TotalPrice < 0)
        {
            return (false, $"Se descartó '{product.Name}' por precios negativos.");
        }

        return (true, string.Empty);
    }
}

