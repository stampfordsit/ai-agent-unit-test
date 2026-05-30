public interface IInventoryService
{
    Task<bool> HasStockAsync(int productId, int quantity);
}

public interface IPaymentService
{
    Task<bool> ProcessPaymentAsync(decimal amount);
}

public class OrderService
{
    private readonly IInventoryService _inventory;
    private readonly IPaymentService _payment;

    public OrderService(
        IInventoryService inventory,
        IPaymentService payment)
    {
        _inventory = inventory;
        _payment = payment;
    }

    public async Task<string> CreateOrderAsync(
        int productId,
        int quantity,
        decimal amount)
    {
        var hasStock =
            await _inventory.HasStockAsync(productId, quantity);

        if (!hasStock)
            return "OUT_OF_STOCK";

        var paymentSuccess =
            await _payment.ProcessPaymentAsync(amount);

        if (!paymentSuccess)
            return "PAYMENT_FAILED";

        return "SUCCESS";
    }
}