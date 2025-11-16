namespace HouseSpend.API.DTOs;

public class StoreAnalyticsDto
{
    public List<StoreStatDto> Stores { get; set; } = new();
    public int TotalStores { get; set; }
    public decimal TotalSpent { get; set; }
    public int TotalTickets { get; set; }
}

public class StoreStatDto
{
    public string StoreName { get; set; } = string.Empty;
    public int TicketCount { get; set; }
    public decimal TotalSpent { get; set; }
    public decimal AverageTicketAmount { get; set; }
    public DateTime? LastPurchaseDate { get; set; }
}

public class MonthlyExpenseDto
{
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal TotalAmount { get; set; }
    public int TicketCount { get; set; }
}

public class CategoryExpenseDto
{
    public string CategoryName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public int ProductCount { get; set; }
    public string CategoryColor { get; set; } = "#6B7280";
}

