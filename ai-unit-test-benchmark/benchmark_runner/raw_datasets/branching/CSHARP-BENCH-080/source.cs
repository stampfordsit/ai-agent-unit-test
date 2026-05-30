public class PaymentService
{
    public string GetPaymentType(int paymentCode)
    {
        switch (paymentCode)
        {
            case 1:
                return "CREDIT_CARD";

            case 2:
                return "QR_PAYMENT";

            case 3:
                return "BANK_TRANSFER";

            default:
                return "UNKNOWN";
        }
    }
}