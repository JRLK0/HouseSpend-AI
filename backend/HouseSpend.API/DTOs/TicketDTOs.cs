namespace HouseSpend.API.DTOs;

public class TicketDto
{
    public int Id { get; set; }
    public string? StoreName { get; set; }
    public decimal? TotalAmount { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public bool IsAnalyzed { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ProductCount { get; set; }
}

public class TicketDetailDto
{
    public int Id { get; set; }
    public string? StoreName { get; set; }
    public decimal? TotalAmount { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public bool IsAnalyzed { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ProductDto> Products { get; set; } = new();
}

public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public CategoryDto? Category { get; set; }
    public bool IsDiscount { get; set; }
}

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

