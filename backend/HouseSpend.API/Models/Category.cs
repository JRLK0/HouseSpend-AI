namespace HouseSpend.API.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Color { get; set; } = "#3B82F6"; // Color por defecto azul

    // Navigation properties
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

