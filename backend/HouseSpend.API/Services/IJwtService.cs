using System.Security.Claims;

namespace HouseSpend.API.Services;

public interface IJwtService
{
    string GenerateToken(int userId, string username, bool isAdmin);
    ClaimsPrincipal? ValidateToken(string token);
}

