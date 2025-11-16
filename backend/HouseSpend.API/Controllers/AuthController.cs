using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using HouseSpend.API.Data;
using HouseSpend.API.DTOs;
using HouseSpend.API.Models;
using HouseSpend.API.Services;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HouseSpend.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly HouseSpendDbContext _context;
    private readonly IPasswordService _passwordService;
    private readonly IJwtService _jwtService;

    public AuthController(
        HouseSpendDbContext context,
        IPasswordService passwordService,
        IJwtService jwtService)
    {
        _context = context;
        _passwordService = passwordService;
        _jwtService = jwtService;
    }

    [HttpPost("register")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
    {
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
            IsAdmin = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user.Id, user.Username, user.IsAdmin);

        return Ok(new AuthResponseDto
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                IsAdmin = user.IsAdmin,
                CreatedAt = user.CreatedAt
            }
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == dto.Username);

        if (user == null || !_passwordService.VerifyPassword(dto.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Usuario o contraseña incorrectos" });
        }

        var token = _jwtService.GenerateToken(user.Id, user.Username, user.IsAdmin);

        return Ok(new AuthResponseDto
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                IsAdmin = user.IsAdmin,
                CreatedAt = user.CreatedAt
            }
        });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        return Ok(new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            IsAdmin = user.IsAdmin,
            CreatedAt = user.CreatedAt
        });
    }
}

