using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HouseSpend.API.Data;
using HouseSpend.API.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HouseSpend.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly HouseSpendDbContext _context;

    public AnalyticsController(HouseSpendDbContext context)
    {
        _context = context;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    [HttpGet("stores")]
    public async Task<ActionResult<StoreAnalyticsDto>> GetStoreAnalytics()
    {
        var userId = GetCurrentUserId();

        var tickets = await _context.Tickets
            .Where(t => t.UserId == userId && t.IsAnalyzed && t.StoreName != null && t.TotalAmount.HasValue)
            .ToListAsync();

        var storeStats = tickets
            .GroupBy(t => t.StoreName)
            .Select(g => new StoreStatDto
            {
                StoreName = g.Key!,
                TicketCount = g.Count(),
                TotalSpent = g.Sum(t => t.TotalAmount ?? 0),
                AverageTicketAmount = g.Average(t => t.TotalAmount ?? 0),
                LastPurchaseDate = g.Max(t => t.PurchaseDate ?? t.CreatedAt)
            })
            .OrderByDescending(s => s.TotalSpent)
            .ToList();

        var totalSpent = tickets.Sum(t => t.TotalAmount ?? 0);
        var totalTickets = tickets.Count;

        return Ok(new StoreAnalyticsDto
        {
            Stores = storeStats,
            TotalStores = storeStats.Count,
            TotalSpent = totalSpent,
            TotalTickets = totalTickets
        });
    }

    [HttpGet("monthly")]
    public async Task<ActionResult<List<MonthlyExpenseDto>>> GetMonthlyExpenses([FromQuery] int? year = null)
    {
        var userId = GetCurrentUserId();
        var targetYear = year ?? DateTime.UtcNow.Year;

        var tickets = await _context.Tickets
            .Where(t => t.UserId == userId && 
                t.IsAnalyzed && 
                t.TotalAmount.HasValue &&
                t.PurchaseDate.HasValue &&
                t.PurchaseDate.Value.Year == targetYear)
            .ToListAsync();

        var monthlyExpenses = tickets
            .GroupBy(t => t.PurchaseDate!.Value.Month)
            .Select(g => new MonthlyExpenseDto
            {
                Month = g.Key,
                Year = targetYear,
                TotalAmount = g.Sum(t => t.TotalAmount ?? 0),
                TicketCount = g.Count()
            })
            .OrderBy(m => m.Month)
            .ToList();

        // Asegurar que todos los meses estén presentes
        for (int month = 1; month <= 12; month++)
        {
            if (!monthlyExpenses.Any(m => m.Month == month))
            {
                monthlyExpenses.Add(new MonthlyExpenseDto
                {
                    Month = month,
                    Year = targetYear,
                    TotalAmount = 0,
                    TicketCount = 0
                });
            }
        }

        return Ok(monthlyExpenses.OrderBy(m => m.Month));
    }

    [HttpGet("categories")]
    public async Task<ActionResult<List<CategoryExpenseDto>>> GetCategoryExpenses([FromQuery] int? year = null, [FromQuery] int? month = null)
    {
        var userId = GetCurrentUserId();
        var targetYear = year ?? DateTime.UtcNow.Year;
        var targetMonth = month ?? DateTime.UtcNow.Month;

        var products = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Ticket)
            .Where(p => p.Ticket.UserId == userId &&
                p.Ticket.IsAnalyzed &&
                (p.Ticket.PurchaseDate.HasValue && 
                 p.Ticket.PurchaseDate.Value.Year == targetYear &&
                 p.Ticket.PurchaseDate.Value.Month == targetMonth))
            .ToListAsync();

        var categoryExpenses = products
            .GroupBy(p => p.Category != null ? p.Category.Name : "Sin categoría")
            .Select(g => new CategoryExpenseDto
            {
                CategoryName = g.Key,
                TotalAmount = g.Sum(p => p.TotalPrice),
                ProductCount = g.Count(),
                CategoryColor = g.First().Category?.Color ?? "#6B7280"
            })
            .OrderByDescending(c => c.TotalAmount)
            .ToList();

        return Ok(categoryExpenses);
    }
}

