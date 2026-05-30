public class RefundService
{
    public decimal CalculateRefund(decimal amount, bool isVip)
    {
        if (amount <= 0)
            return 0;

        if (isVip && amount >= 5000)
            return amount * 0.20m;

        if (amount >= 1000)
            return amount * 0.10m;

        return amount * 0.05m;
    }
}