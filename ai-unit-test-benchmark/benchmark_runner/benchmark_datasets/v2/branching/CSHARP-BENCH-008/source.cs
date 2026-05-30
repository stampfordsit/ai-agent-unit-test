public class ShippingService
{
    public string GetShippingStatus(decimal totalAmount)
    {
        if (totalAmount >= 5000)
            return "FREE_EXPRESS";

        if (totalAmount >= 1000)
            return "FREE_STANDARD";

        return "PAID";
    }
}