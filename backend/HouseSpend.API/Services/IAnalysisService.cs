using HouseSpend.API.Models;

namespace HouseSpend.API.Services;

public interface IAnalysisService
{
    Task<TicketAnalysisResult> AnalyzeTicketAsync(byte[] imageData, string contentType);
    Task<string?> ExtractStoreNameAsync(byte[] imageData, string contentType);
}

public class TicketAnalysisResult
{
    public string StoreName { get; set; } = string.Empty;
    public DateTime? PurchaseDate { get; set; }
    public decimal TotalAmount { get; set; }
    public List<ProductAnalysis> Products { get; set; } = new();
}

public class ProductAnalysis
{
    public string Name { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public string? CategoryName { get; set; }
    public bool IsDiscount { get; set; }
}

