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
        try
        {
            var hasAdmin = await _context.Users.AnyAsync(u => u.IsAdmin);
            return Ok(new SetupCheckDto { IsSetupComplete = hasAdmin });
        }
        catch
        {
            // Si hay error (probablemente tabla no existe), asumir que no está configurado
            return Ok(new SetupCheckDto { IsSetupComplete = false });
        }
    }

    [HttpPost("admin")]
    public async Task<ActionResult> CreateAdmin([FromBody] SetupAdminDto dto)
    {
        try
        {
            // Validar datos de entrada
            if (string.IsNullOrWhiteSpace(dto.Username))
            {
                return BadRequest(new { message = "El nombre de usuario es requerido" });
            }

            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { message = "El email es requerido" });
            }

            if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
            {
                return BadRequest(new { message = "La contraseña debe tener al menos 6 caracteres" });
            }

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
                Username = dto.Username.Trim(),
                Email = dto.Email.Trim().ToLowerInvariant(),
                PasswordHash = _passwordService.HashPassword(dto.Password),
                IsAdmin = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Administrador creado exitosamente" });
        }
        catch (DbUpdateException ex)
        {
            return StatusCode(500, new { message = "Error al guardar en la base de datos. Verifica que las tablas estén creadas correctamente.", error = ex.InnerException?.Message ?? ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error inesperado al crear el administrador", error = ex.Message });
        }
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

