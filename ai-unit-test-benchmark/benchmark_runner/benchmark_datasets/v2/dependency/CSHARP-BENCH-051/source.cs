public interface IEmailService
{
    Task SendAsync(string email, string message);
}

public class NotificationService
{
    private readonly IEmailService _emailService;

    public NotificationService(IEmailService emailService)
    {
        _emailService = emailService;
    }

    public async Task<bool> SendWelcomeEmailAsync(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;

        await _emailService.SendAsync(
            email,
            "Welcome to our platform");

        return true;
    }
}