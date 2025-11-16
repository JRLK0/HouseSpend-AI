namespace HouseSpend.API.DTOs;

public class SetupCheckDto
{
    public bool IsSetupComplete { get; set; }
}

public class SetupAdminDto
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class ConfigOpenAIDto
{
    public string ApiKey { get; set; } = string.Empty;
}

