public class PaymentService
{
    public bool ProcessPayment(decimal amount)
    {
        if (amount <= 0)
            return false;

        return true;
    }
}