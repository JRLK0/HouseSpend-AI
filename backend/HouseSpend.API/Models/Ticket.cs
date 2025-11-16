namespace HouseSpend.API.Models;

public class Ticket
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? StoreName { get; set; }
    public decimal? TotalAmount { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public byte[]? ImageData { get; set; } // BLOB storage
    public string? ImageContentType { get; set; } // MIME type
    public bool IsAnalyzed { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<StockTransaction> StockTransactions { get; set; } = new List<StockTransaction>();
}

