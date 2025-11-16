using System.Text;
using System.Text.Json;
using System.Net;
using System.Net.Http.Headers;
using HouseSpend.API.Data;
using HouseSpend.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;

namespace HouseSpend.API.Services;

public class OpenAIAnalysisService : IAnalysisService
{
    private readonly HouseSpendDbContext _context;
    private readonly IEncryptionService _encryptionService;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public OpenAIAnalysisService(
        HouseSpendDbContext context,
        IEncryptionService encryptionService,
        IConfiguration configuration,
        HttpClient httpClient)
    {
        _context = context;
        _encryptionService = encryptionService;
        _configuration = configuration;
        _httpClient = httpClient;
    }

    public async Task<TicketAnalysisResult> AnalyzeTicketAsync(byte[] imageData, string contentType)
    {
        var apiKey = await GetOpenAIApiKeyAsync();
        if (string.IsNullOrEmpty(apiKey))
        {
            throw new AnalysisException(
                "La API Key de OpenAI no está configurada. Configúrala antes de analizar tickets.",
                StatusCodes.Status400BadRequest);
        }

        var base64Image = Convert.ToBase64String(imageData);

        var prompt = @"Analiza esta imagen de un ticket de compra y extrae la siguiente información en formato JSON:

{
  ""storeName"": ""nombre del comercio"",
  ""purchaseDate"": ""YYYY-MM-DD o null si no se encuentra"",
  ""totalAmount"": 0.00,
  ""products"": [
    {
      ""name"": ""nombre del producto"",
      ""quantity"": 1.0,
      ""unitPrice"": 0.00,
      ""totalPrice"": 0.00,
      ""categoryName"": ""Alimentación|Limpieza|Cuidado Personal|Bebidas|Frutas y Verduras|Carnes y Pescados|Lácteos|Panadería|Congelados|Otros"",
      ""isDiscount"": false
    }
  ]
}

IMPORTANTE:
- Identifica TODOS los productos del ticket
- Para cada producto, determina la categoría más apropiada de la lista proporcionada
- Si un producto tiene descuento o está rebajado, marca isDiscount como true
- El totalAmount debe ser el total final del ticket
- Si no puedes identificar algún campo, usa null o valores por defecto apropiados
- Responde SOLO con el JSON válido, sin texto adicional";

        var messages = new object[]
        {
            new
            {
                role = "system",
                content = "Eres un experto en análisis de tickets de compra. Extrae información precisa y estructurada."
            },
            new
            {
                role = "user",
                content = new object[]
                {
                    new
                    {
                        type = "text",
                        text = prompt
                    },
                    new
                    {
                        type = "image_url",
                        image_url = new
                        {
                            url = $"data:{contentType};base64,{base64Image}"
                        }
                    }
                }
            }
        };

        var requestBody = new
        {
            model = "gpt-4o",
            messages,
            response_format = new { type = "json_object" },
            max_tokens = 4000
        };

        var jsonContent = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions")
            {
                Content = content
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var response = await _httpClient.SendAsync(request);

            if (response.StatusCode == HttpStatusCode.Unauthorized)
            {
                throw new AnalysisException(
                    "La API Key de OpenAI es inválida o ha expirado.",
                    StatusCodes.Status401Unauthorized);
            }

            if (response.StatusCode == (HttpStatusCode)429)
            {
                throw new AnalysisException(
                    "OpenAI rechazó la solicitud por límite de peticiones. Intenta nuevamente en unos segundos.",
                    StatusCodes.Status429TooManyRequests);
            }

            if (!response.IsSuccessStatusCode)
            {
                var errorPayload = await response.Content.ReadAsStringAsync();
                throw new AnalysisException(
                    $"OpenAI retornó un error {(int)response.StatusCode}.",
                    StatusCodes.Status502BadGateway,
                    new Exception(errorPayload));
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            var openAiResponse = JsonSerializer.Deserialize<OpenAIResponse>(responseJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            var responseText = openAiResponse?.Choices?.FirstOrDefault()?.Message?.Content ?? "{}";

            // Limpiar la respuesta si tiene markdown code blocks
            responseText = responseText.Trim();
            if (responseText.StartsWith("```json"))
            {
                responseText = responseText.Substring(7);
            }
            if (responseText.StartsWith("```"))
            {
                responseText = responseText.Substring(3);
            }
            if (responseText.EndsWith("```"))
            {
                responseText = responseText.Substring(0, responseText.Length - 3);
            }
            responseText = responseText.Trim();

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var analysisData = JsonSerializer.Deserialize<TicketAnalysisData>(responseText, options)
                ?? throw new InvalidOperationException("No se pudo parsear la respuesta de OpenAI");

            var result = new TicketAnalysisResult
            {
                StoreName = analysisData.StoreName ?? string.Empty,
                PurchaseDate = ParseDate(analysisData.PurchaseDate),
                TotalAmount = analysisData.TotalAmount,
                Products = analysisData.Products?.Select(p => new ProductAnalysis
                {
                    Name = p.Name ?? string.Empty,
                    Quantity = p.Quantity,
                    UnitPrice = p.UnitPrice,
                    TotalPrice = p.TotalPrice,
                    CategoryName = p.CategoryName,
                    IsDiscount = p.IsDiscount
                }).ToList() ?? new List<ProductAnalysis>()
            };

            return result;
        }
        catch (AnalysisException)
        {
            throw;
        }
        catch (HttpRequestException ex)
        {
            throw new AnalysisException(
                "No se pudo contactar con OpenAI. Verifica tu conexión e inténtalo de nuevo.",
                StatusCodes.Status503ServiceUnavailable,
                ex);
        }
        catch (JsonException ex)
        {
            throw new AnalysisException(
                "OpenAI devolvió una respuesta inválida.",
                StatusCodes.Status502BadGateway,
                ex);
        }
        catch (Exception ex)
        {
            throw new AnalysisException(
                $"Error inesperado al analizar el ticket: {ex.Message}",
                StatusCodes.Status500InternalServerError,
                ex);
        }
    }

    private async Task<string?> GetOpenAIApiKeyAsync()
    {
        var config = await _context.AppConfigs
            .FirstOrDefaultAsync(c => c.Key == "OpenAI_ApiKey");

        if (config == null || string.IsNullOrEmpty(config.Value))
            return null;

        return _encryptionService.Decrypt(config.Value);
    }

    public async Task<string?> ExtractStoreNameAsync(byte[] imageData, string contentType)
    {
        var apiKey = await GetOpenAIApiKeyAsync();
        if (string.IsNullOrEmpty(apiKey))
        {
            return null; // Si no hay API key, retornar null sin lanzar excepción
        }

        var base64Image = Convert.ToBase64String(imageData);

        var prompt = @"Analiza esta imagen de un ticket de compra y extrae SOLO el nombre del comercio donde se realizó la compra. Responde únicamente con el nombre del comercio, sin texto adicional ni formato JSON.";

        var requestBody = new
        {
            model = "gpt-4o",
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = "Eres un experto en leer tickets de compra. Extrae únicamente el nombre del comercio."
                },
                new
                {
                    role = "user",
                    content = new object[]
                    {
                        new
                        {
                            type = "text",
                            text = prompt
                        },
                        new
                        {
                            type = "image_url",
                            image_url = new
                            {
                                url = $"data:{contentType};base64,{base64Image}"
                            }
                        }
                    }
                }
            },
            max_tokens = 100
        };

        var jsonContent = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

        try
        {
            var response = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions", content);
            
            if (!response.IsSuccessStatusCode)
            {
                return null; // Si falla, retornar null sin lanzar excepción
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            var openAiResponse = JsonSerializer.Deserialize<OpenAIResponse>(responseJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            var storeName = openAiResponse?.Choices?.FirstOrDefault()?.Message?.Content?.Trim();
            
            // Limpiar posibles comillas o caracteres extra
            if (!string.IsNullOrEmpty(storeName))
            {
                storeName = storeName.Trim('"', '\'', '`', ' ', '\n', '\r');
            }

            return string.IsNullOrWhiteSpace(storeName) ? null : storeName;
        }
        catch
        {
            return null; // En caso de error, retornar null sin bloquear
        }
    }

    private DateTime? ParseDate(string? dateString)
    {
        if (string.IsNullOrWhiteSpace(dateString))
            return null;

        if (DateTime.TryParse(dateString, out var date))
        {
            if (date.Kind == DateTimeKind.Utc)
            {
                return date;
            }

            return DateTime.SpecifyKind(date, DateTimeKind.Utc);
        }

        return null;
    }

    private class OpenAIResponse
    {
        public List<OpenAIChoice>? Choices { get; set; }
    }

    private class OpenAIChoice
    {
        public OpenAIMessage? Message { get; set; }
    }

    private class OpenAIMessage
    {
        public string? Content { get; set; }
    }

    private class TicketAnalysisData
    {
        public string? StoreName { get; set; }
        public string? PurchaseDate { get; set; }
        public decimal TotalAmount { get; set; }
        public List<ProductAnalysisData>? Products { get; set; }
    }

    private class ProductAnalysisData
    {
        public string? Name { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public string? CategoryName { get; set; }
        public bool IsDiscount { get; set; }
    }
}
