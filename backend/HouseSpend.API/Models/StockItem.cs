namespace HouseSpend.API.Models;

public class StockItem
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public decimal CurrentQuantity { get; set; }
    public string Unit { get; set; } = "unidad"; // unidad, kg, litro, etc.
    public decimal? MinQuantity { get; set; } // Alerta cuando está por debajo
    public decimal? MaxQuantity { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public Category? Category { get; set; }
    public ICollection<StockTransaction> Transactions { get; set; } = new List<StockTransaction>();
}

