public class NotificationService
{
    public async Task<string> SendAsync(
        string email,
        CancellationToken cancellationToken)
    {
        await Task.Delay(50, cancellationToken);

        if (string.IsNullOrWhiteSpace(email))
            return "INVALID_EMAIL";

        return "SENT";
    }
}