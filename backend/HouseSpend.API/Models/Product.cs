namespace HouseSpend.API.Models;

public class Product
{
    public int Id { get; set; }
    public int TicketId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public int? CategoryId { get; set; }
    public bool IsDiscount { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Ticket Ticket { get; set; } = null!;
    public Category? Category { get; set; }
}

