namespace HouseSpend.API.DTOs;

public class StockItemDto
{
    public int Id { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public CategoryDto? Category { get; set; }
    public decimal CurrentQuantity { get; set; }
    public string Unit { get; set; } = "unidad";
    public decimal? MinQuantity { get; set; }
    public decimal? MaxQuantity { get; set; }
    public DateTime LastUpdated { get; set; }
    public string? Notes { get; set; }
    public bool IsLowStock { get; set; }
}

public class StockItemCreateDto
{
    public string ProductName { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public decimal CurrentQuantity { get; set; }
    public string Unit { get; set; } = "unidad";
    public decimal? MinQuantity { get; set; }
    public decimal? MaxQuantity { get; set; }
    public string? Notes { get; set; }
}

public class StockItemUpdateDto
{
    public string? ProductName { get; set; }
    public int? CategoryId { get; set; }
    public decimal? CurrentQuantity { get; set; }
    public string? Unit { get; set; }
    public decimal? MinQuantity { get; set; }
    public decimal? MaxQuantity { get; set; }
    public string? Notes { get; set; }
}

public class StockTransactionDto
{
    public int Id { get; set; }
    public int StockItemId { get; set; }
    public string StockItemName { get; set; } = string.Empty;
    public int? TicketId { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public DateTime Date { get; set; }
    public string? Notes { get; set; }
}

public class StockAdjustmentDto
{
    public decimal Quantity { get; set; }
    public string? Notes { get; set; }
}

public class StockConsumptionDto
{
    public decimal Quantity { get; set; }
    public string? Notes { get; set; }
}

