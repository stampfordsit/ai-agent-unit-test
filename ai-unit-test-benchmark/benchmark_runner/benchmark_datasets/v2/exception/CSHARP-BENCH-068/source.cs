public class OrderService
{
    private bool _isProcessed;

    public void ProcessOrder()
    {
        if (_isProcessed)
            throw new InvalidOperationException(
                "Order already processed");

        _isProcessed = true;
    }
}