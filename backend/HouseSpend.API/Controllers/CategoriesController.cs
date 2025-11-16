using Microsoft.AspNetCore.Mvc;
using HouseSpend.API.Data;
using HouseSpend.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace HouseSpend.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly HouseSpendDbContext _context;

    public CategoriesController(HouseSpendDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
    {
        var categories = await _context.Categories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Color = c.Color
            })
            .ToListAsync();

        return Ok(categories);
    }
}

