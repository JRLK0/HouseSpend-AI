using Microsoft.AspNetCore.Mvc;
using HouseSpend.API.Data;
using HouseSpend.API.DTOs;
using HouseSpend.API.Models;
using HouseSpend.API.Services;
using Microsoft.EntityFrameworkCore;

namespace HouseSpend.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SetupController : ControllerBase
{
    private readonly HouseSpendDbContext _context;
    private readonly IPasswordService _passwordService;
    private readonly IEncryptionService _encryptionService;

    public SetupController(
        HouseSpendDbContext context,
        IPasswordService passwordService,
        IEncryptionService encryptionService)
    {
        _context = context;
        _passwordService = passwordService;
        _encryptionService = encryptionService;
    }

    [HttpGet("check")]
    public async Task<ActionResult<SetupCheckDto>> CheckSetup()
    {
        var hasAdmin = await _context.Users.AnyAsync(u => u.IsAdmin);
        return Ok(new SetupCheckDto { IsSetupComplete = hasAdmin });
    }

    [HttpPost("admin")]
    public async Task<ActionResult> CreateAdmin([FromBody] SetupAdminDto dto)
    {
        // Verificar que no exista un admin
        var hasAdmin = await _context.Users.AnyAsync(u => u.IsAdmin);
        if (hasAdmin)
        {
            return BadRequest(new { message = "Ya existe un administrador en el sistema" });
        }

        // Verificar que el username y email no existan
        var userExists = await _context.Users
            .AnyAsync(u => u.Username == dto.Username || u.Email == dto.Email);

        if (userExists)
        {
            return BadRequest(new { message = "El usuario o email ya existe" });
        }

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = _passwordService.HashPassword(dto.Password),
            IsAdmin = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Administrador creado exitosamente" });
    }

    [HttpPost("openai")]
    public async Task<ActionResult> ConfigureOpenAI([FromBody] ConfigOpenAIDto dto)
    {
        // Verificar que exista un admin
        var hasAdmin = await _context.Users.AnyAsync(u => u.IsAdmin);
        if (!hasAdmin)
        {
            return BadRequest(new { message = "Debe crear un administrador primero" });
        }

        var encryptedKey = _encryptionService.Encrypt(dto.ApiKey);

        var config = await _context.AppConfigs
            .FirstOrDefaultAsync(c => c.Key == "OpenAI_ApiKey");

        if (config != null)
        {
            config.Value = encryptedKey;
            config.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            config = new AppConfig
            {
                Key = "OpenAI_ApiKey",
                Value = encryptedKey,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.AppConfigs.Add(config);
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "API Key de OpenAI configurada exitosamente" });
    }
}

