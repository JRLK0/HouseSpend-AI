namespace HouseSpend.API.Models;

public enum TransactionType
{
    Purchase,      // Compra (desde ticket)
    Consumption,   // Consumo manual
    Adjustment,    // Ajuste manual
    Expiration     // Vencimiento/Pérdida
}

public class StockTransaction
{
    public int Id { get; set; }
    public int StockItemId { get; set; }
    public int? TicketId { get; set; } // Opcional, solo si viene de un ticket
    public TransactionType TransactionType { get; set; }
    public decimal Quantity { get; set; } // Positivo para compras, negativo para consumos
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }

    // Navigation properties
    public StockItem StockItem { get; set; } = null!;
    public Ticket? Ticket { get; set; }
}

