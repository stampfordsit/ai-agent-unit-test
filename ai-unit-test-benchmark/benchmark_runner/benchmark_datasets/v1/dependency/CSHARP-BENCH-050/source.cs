public interface ILoggerService
{
    Task LogErrorAsync(string message);
}

public class PaymentService
{
    private readonly ILoggerService _logger;

    public PaymentService(ILoggerService logger)
    {
        _logger = logger;
    }

    public async Task<bool> ProcessAsync(decimal amount)
    {
        if (amount <= 0)
        {
            await _logger.LogErrorAsync("Invalid payment amount");
            return false;
        }

        return true;
    }
}