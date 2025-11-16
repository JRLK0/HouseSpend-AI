using Microsoft.AspNetCore.Http;

namespace HouseSpend.API.Services;

public class AnalysisException : Exception
{
    public int StatusCode { get; }

    public AnalysisException(
        string message,
        int statusCode = StatusCodes.Status500InternalServerError,
        Exception? innerException = null) : base(message, innerException)
    {
        StatusCode = statusCode;
    }
}

