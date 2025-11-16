using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HouseSpend.API.Data;
using HouseSpend.API.DTOs;
using HouseSpend.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HouseSpend.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StockController : ControllerBase
{
    private readonly HouseSpendDbContext _context;
    private readonly ILogger<StockController> _logger;

    public StockController(HouseSpendDbContext context, ILogger<StockController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    [HttpGet]
    public async Task<ActionResult<List<StockItemDto>>> GetStockItems()
    {
        var userId = GetCurrentUserId();
        var items = await _context.StockItems
            .Include(s => s.Category)
            .Where(s => s.UserId == userId)
            .OrderBy(s => s.ProductName)
            .ToListAsync();

        var dtos = items.Select(item => new StockItemDto
        {
            Id = item.Id,
            ProductName = item.ProductName,
            CategoryId = item.CategoryId,
            Category = item.Category != null ? new CategoryDto
            {
                Id = item.Category.Id,
                Name = item.Category.Name,
                Description = item.Category.Description,
                Color = item.Category.Color
            } : null,
            CurrentQuantity = item.CurrentQuantity,
            Unit = item.Unit,
            MinQuantity = item.MinQuantity,
            MaxQuantity = item.MaxQuantity,
            LastUpdated = item.LastUpdated,
            Notes = item.Notes,
            IsLowStock = item.MinQuantity.HasValue && item.CurrentQuantity <= item.MinQuantity.Value
        }).ToList();

        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<StockItemDto>> GetStockItem(int id)
    {
        var userId = GetCurrentUserId();
        var item = await _context.StockItems
            .Include(s => s.Category)
            .Include(s => s.Transactions.OrderByDescending(t => t.Date).Take(20))
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (item == null)
        {
            return NotFound(new { message = "Item de stock no encontrado" });
        }

        var dto = new StockItemDto
        {
            Id = item.Id,
            ProductName = item.ProductName,
            CategoryId = item.CategoryId,
            Category = item.Category != null ? new CategoryDto
            {
                Id = item.Category.Id,
                Name = item.Category.Name,
                Description = item.Category.Description,
                Color = item.Category.Color
            } : null,
            CurrentQuantity = item.CurrentQuantity,
            Unit = item.Unit,
            MinQuantity = item.MinQuantity,
            MaxQuantity = item.MaxQuantity,
            LastUpdated = item.LastUpdated,
            Notes = item.Notes,
            IsLowStock = item.MinQuantity.HasValue && item.CurrentQuantity <= item.MinQuantity.Value
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<StockItemDto>> CreateStockItem(StockItemCreateDto dto)
    {
        var userId = GetCurrentUserId();

        // Verificar si ya existe un item con el mismo nombre para este usuario
        var existing = await _context.StockItems
            .FirstOrDefaultAsync(s => s.UserId == userId && s.ProductName.ToLower() == dto.ProductName.ToLower());

        if (existing != null)
        {
            return BadRequest(new { message = "Ya existe un producto con ese nombre en tu stock" });
        }

        var item = new StockItem
        {
            UserId = userId,
            ProductName = dto.ProductName,
            CategoryId = dto.CategoryId,
            CurrentQuantity = dto.CurrentQuantity,
            Unit = dto.Unit,
            MinQuantity = dto.MinQuantity,
            MaxQuantity = dto.MaxQuantity,
            Notes = dto.Notes,
            LastUpdated = DateTime.UtcNow
        };

        _context.StockItems.Add(item);
        await _context.SaveChangesAsync();

        // Crear transacción inicial
        var transaction = new StockTransaction
        {
            StockItemId = item.Id,
            TransactionType = TransactionType.Adjustment,
            Quantity = dto.CurrentQuantity,
            Date = DateTime.UtcNow,
            Notes = "Stock inicial"
        };

        _context.StockTransactions.Add(transaction);
        await _context.SaveChangesAsync();

        await _context.Entry(item).Reference(s => s.Category).LoadAsync();

        var result = new StockItemDto
        {
            Id = item.Id,
            ProductName = item.ProductName,
            CategoryId = item.CategoryId,
            Category = item.Category != null ? new CategoryDto
            {
                Id = item.Category.Id,
                Name = item.Category.Name,
                Description = item.Category.Description,
                Color = item.Category.Color
            } : null,
            CurrentQuantity = item.CurrentQuantity,
            Unit = item.Unit,
            MinQuantity = item.MinQuantity,
            MaxQuantity = item.MaxQuantity,
            LastUpdated = item.LastUpdated,
            Notes = item.Notes,
            IsLowStock = item.MinQuantity.HasValue && item.CurrentQuantity <= item.MinQuantity.Value
        };

        return CreatedAtAction(nameof(GetStockItem), new { id = item.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<StockItemDto>> UpdateStockItem(int id, StockItemUpdateDto dto)
    {
        var userId = GetCurrentUserId();
        var item = await _context.StockItems
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (item == null)
        {
            return NotFound(new { message = "Item de stock no encontrado" });
        }

        // Verificar nombre duplicado si se está cambiando
        if (!string.IsNullOrEmpty(dto.ProductName) && dto.ProductName.ToLower() != item.ProductName.ToLower())
        {
            var existing = await _context.StockItems
                .FirstOrDefaultAsync(s => s.UserId == userId && s.Id != id && s.ProductName.ToLower() == dto.ProductName.ToLower());

            if (existing != null)
            {
                return BadRequest(new { message = "Ya existe un producto con ese nombre en tu stock" });
            }
        }

        if (!string.IsNullOrEmpty(dto.ProductName))
            item.ProductName = dto.ProductName;
        if (dto.CategoryId.HasValue)
            item.CategoryId = dto.CategoryId;
        if (dto.CurrentQuantity.HasValue)
            item.CurrentQuantity = dto.CurrentQuantity.Value;
        if (!string.IsNullOrEmpty(dto.Unit))
            item.Unit = dto.Unit;
        if (dto.MinQuantity.HasValue)
            item.MinQuantity = dto.MinQuantity;
        if (dto.MaxQuantity.HasValue)
            item.MaxQuantity = dto.MaxQuantity;
        if (dto.Notes != null)
            item.Notes = dto.Notes;

        item.LastUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _context.Entry(item).Reference(s => s.Category).LoadAsync();

        var result = new StockItemDto
        {
            Id = item.Id,
            ProductName = item.ProductName,
            CategoryId = item.CategoryId,
            Category = item.Category != null ? new CategoryDto
            {
                Id = item.Category.Id,
                Name = item.Category.Name,
                Description = item.Category.Description,
                Color = item.Category.Color
            } : null,
            CurrentQuantity = item.CurrentQuantity,
            Unit = item.Unit,
            MinQuantity = item.MinQuantity,
            MaxQuantity = item.MaxQuantity,
            LastUpdated = item.LastUpdated,
            Notes = item.Notes,
            IsLowStock = item.MinQuantity.HasValue && item.CurrentQuantity <= item.MinQuantity.Value
        };

        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStockItem(int id)
    {
        var userId = GetCurrentUserId();
        var item = await _context.StockItems
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (item == null)
        {
            return NotFound(new { message = "Item de stock no encontrado" });
        }

        _context.StockItems.Remove(item);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id}/adjust")]
    public async Task<ActionResult<StockItemDto>> AdjustStock(int id, StockAdjustmentDto dto)
    {
        var userId = GetCurrentUserId();
        var item = await _context.StockItems
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (item == null)
        {
            return NotFound(new { message = "Item de stock no encontrado" });
        }

        var oldQuantity = item.CurrentQuantity;
        item.CurrentQuantity = dto.Quantity;
        item.LastUpdated = DateTime.UtcNow;

        var transaction = new StockTransaction
        {
            StockItemId = item.Id,
            TransactionType = TransactionType.Adjustment,
            Quantity = dto.Quantity - oldQuantity,
            Date = DateTime.UtcNow,
            Notes = dto.Notes ?? $"Ajuste manual: {oldQuantity} → {dto.Quantity}"
        };

        _context.StockTransactions.Add(transaction);
        await _context.SaveChangesAsync();

        await _context.Entry(item).Reference(s => s.Category).LoadAsync();

        var result = new StockItemDto
        {
            Id = item.Id,
            ProductName = item.ProductName,
            CategoryId = item.CategoryId,
            Category = item.Category != null ? new CategoryDto
            {
                Id = item.Category.Id,
                Name = item.Category.Name,
                Description = item.Category.Description,
                Color = item.Category.Color
            } : null,
            CurrentQuantity = item.CurrentQuantity,
            Unit = item.Unit,
            MinQuantity = item.MinQuantity,
            MaxQuantity = item.MaxQuantity,
            LastUpdated = item.LastUpdated,
            Notes = item.Notes,
            IsLowStock = item.MinQuantity.HasValue && item.CurrentQuantity <= item.MinQuantity.Value
        };

        return Ok(result);
    }

    [HttpPost("{id}/consume")]
    public async Task<ActionResult<StockItemDto>> ConsumeStock(int id, StockConsumptionDto dto)
    {
        var userId = GetCurrentUserId();
        var item = await _context.StockItems
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (item == null)
        {
            return NotFound(new { message = "Item de stock no encontrado" });
        }

        if (dto.Quantity <= 0)
        {
            return BadRequest(new { message = "La cantidad debe ser mayor que cero" });
        }

        if (item.CurrentQuantity < dto.Quantity)
        {
            return BadRequest(new { message = "No hay suficiente stock disponible" });
        }

        item.CurrentQuantity -= dto.Quantity;
        item.LastUpdated = DateTime.UtcNow;

        var transaction = new StockTransaction
        {
            StockItemId = item.Id,
            TransactionType = TransactionType.Consumption,
            Quantity = -dto.Quantity,
            Date = DateTime.UtcNow,
            Notes = dto.Notes ?? "Consumo manual"
        };

        _context.StockTransactions.Add(transaction);
        await _context.SaveChangesAsync();

        await _context.Entry(item).Reference(s => s.Category).LoadAsync();

        var result = new StockItemDto
        {
            Id = item.Id,
            ProductName = item.ProductName,
            CategoryId = item.CategoryId,
            Category = item.Category != null ? new CategoryDto
            {
                Id = item.Category.Id,
                Name = item.Category.Name,
                Description = item.Category.Description,
                Color = item.Category.Color
            } : null,
            CurrentQuantity = item.CurrentQuantity,
            Unit = item.Unit,
            MinQuantity = item.MinQuantity,
            MaxQuantity = item.MaxQuantity,
            LastUpdated = item.LastUpdated,
            Notes = item.Notes,
            IsLowStock = item.MinQuantity.HasValue && item.CurrentQuantity <= item.MinQuantity.Value
        };

        return Ok(result);
    }

    [HttpGet("alerts")]
    public async Task<ActionResult<List<StockItemDto>>> GetLowStockAlerts()
    {
        var userId = GetCurrentUserId();
        var items = await _context.StockItems
            .Include(s => s.Category)
            .Where(s => s.UserId == userId && s.MinQuantity.HasValue && s.CurrentQuantity <= s.MinQuantity.Value)
            .OrderBy(s => s.CurrentQuantity)
            .ToListAsync();

        var dtos = items.Select(item => new StockItemDto
        {
            Id = item.Id,
            ProductName = item.ProductName,
            CategoryId = item.CategoryId,
            Category = item.Category != null ? new CategoryDto
            {
                Id = item.Category.Id,
                Name = item.Category.Name,
                Description = item.Category.Description,
                Color = item.Category.Color
            } : null,
            CurrentQuantity = item.CurrentQuantity,
            Unit = item.Unit,
            MinQuantity = item.MinQuantity,
            MaxQuantity = item.MaxQuantity,
            LastUpdated = item.LastUpdated,
            Notes = item.Notes,
            IsLowStock = true
        }).ToList();

        return Ok(dtos);
    }

    [HttpGet("{id}/transactions")]
    public async Task<ActionResult<List<StockTransactionDto>>> GetStockTransactions(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var userId = GetCurrentUserId();
        var item = await _context.StockItems
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (item == null)
        {
            return NotFound(new { message = "Item de stock no encontrado" });
        }

        var transactions = await _context.StockTransactions
            .Where(t => t.StockItemId == id)
            .OrderByDescending(t => t.Date)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = transactions.Select(t => new StockTransactionDto
        {
            Id = t.Id,
            StockItemId = t.StockItemId,
            StockItemName = item.ProductName,
            TicketId = t.TicketId,
            TransactionType = t.TransactionType.ToString(),
            Quantity = t.Quantity,
            Date = t.Date,
            Notes = t.Notes
        }).ToList();

        return Ok(dtos);
    }
}

