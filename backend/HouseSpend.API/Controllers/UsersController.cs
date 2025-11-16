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
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly HouseSpendDbContext _context;
    private readonly IPasswordService _passwordService;

    public UsersController(
        HouseSpendDbContext context,
        IPasswordService passwordService)
    {
        _context = context;
        _passwordService = passwordService;
    }

    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetUsers()
    {
        var users = await _context.Users
            .OrderBy(u => u.Username)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                IsAdmin = u.IsAdmin,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserDto dto)
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
            IsAdmin = dto.IsAdmin,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            IsAdmin = user.IsAdmin,
            CreatedAt = user.CreatedAt
        });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteUser(int id)
    {
        var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(currentUserIdClaim) || !int.TryParse(currentUserIdClaim, out var currentUserId))
        {
            return Unauthorized();
        }

        // No permitir eliminar el propio usuario
        if (id == currentUserId)
        {
            return BadRequest(new { message = "No puedes eliminar tu propio usuario" });
        }

        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound();
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

