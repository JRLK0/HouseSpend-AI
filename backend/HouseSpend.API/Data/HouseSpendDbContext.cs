using Microsoft.EntityFrameworkCore;
using HouseSpend.API.Models;

namespace HouseSpend.API.Data;

public class HouseSpendDbContext : DbContext
{
    public HouseSpendDbContext(DbContextOptions<HouseSpendDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Ticket> Tickets { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<AppConfig> AppConfigs { get; set; }
    public DbSet<StockItem> StockItems { get; set; }
    public DbSet<StockTransaction> StockTransactions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.PasswordHash).IsRequired();
        });

        // Ticket configuration
        modelBuilder.Entity<Ticket>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                .WithMany(u => u.Tickets)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.StoreName).HasMaxLength(200);
        });

        // Product configuration
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Ticket)
                .WithMany(t => t.Products)
                .HasForeignKey(e => e.TicketId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Quantity).HasPrecision(18, 3);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
            entity.Property(e => e.TotalPrice).HasPrecision(18, 2);
        });

        // Category configuration
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Color).HasMaxLength(7).HasDefaultValue("#3B82F6");
        });

        // AppConfig configuration
        modelBuilder.Entity<AppConfig>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Key).IsUnique();
            entity.Property(e => e.Key).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Value).IsRequired();
        });

        // StockItem configuration
        modelBuilder.Entity<StockItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Category)
                .WithMany()
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.Property(e => e.ProductName).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Unit).IsRequired().HasMaxLength(50).HasDefaultValue("unidad");
            entity.Property(e => e.CurrentQuantity).HasPrecision(18, 3);
            entity.Property(e => e.MinQuantity).HasPrecision(18, 3);
            entity.Property(e => e.MaxQuantity).HasPrecision(18, 3);
            entity.HasIndex(e => new { e.UserId, e.ProductName }).IsUnique();
        });

        // StockTransaction configuration
        modelBuilder.Entity<StockTransaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.StockItem)
                .WithMany(s => s.Transactions)
                .HasForeignKey(e => e.StockItemId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Ticket)
                .WithMany(t => t.StockTransactions)
                .HasForeignKey(e => e.TicketId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.Property(e => e.Quantity).HasPrecision(18, 3);
            entity.Property(e => e.TransactionType).IsRequired();
            entity.HasIndex(e => e.Date);
            entity.HasIndex(e => e.StockItemId);
        });

        // Seed categories
        SeedCategories(modelBuilder);
    }

    private void SeedCategories(ModelBuilder modelBuilder)
    {
        var categories = new List<Category>
        {
            new Category { Id = 1, Name = "Alimentación", Description = "Productos alimenticios y bebidas", Color = "#10B981" },
            new Category { Id = 2, Name = "Limpieza", Description = "Productos de limpieza del hogar", Color = "#3B82F6" },
            new Category { Id = 3, Name = "Cuidado Personal", Description = "Productos de higiene y cuidado personal", Color = "#8B5CF6" },
            new Category { Id = 4, Name = "Bebidas", Description = "Bebidas alcohólicas y no alcohólicas", Color = "#F59E0B" },
            new Category { Id = 5, Name = "Frutas y Verduras", Description = "Frutas y verduras frescas", Color = "#22C55E" },
            new Category { Id = 6, Name = "Carnes y Pescados", Description = "Carnes, pescados y mariscos", Color = "#EF4444" },
            new Category { Id = 7, Name = "Lácteos", Description = "Leche, queso, yogur y derivados", Color = "#FBBF24" },
            new Category { Id = 8, Name = "Panadería", Description = "Pan, bollería y repostería", Color = "#F97316" },
            new Category { Id = 9, Name = "Congelados", Description = "Productos congelados", Color = "#06B6D4" },
            new Category { Id = 10, Name = "Otros", Description = "Otros productos", Color = "#6B7280" }
        };

        modelBuilder.Entity<Category>().HasData(categories);
    }
}

