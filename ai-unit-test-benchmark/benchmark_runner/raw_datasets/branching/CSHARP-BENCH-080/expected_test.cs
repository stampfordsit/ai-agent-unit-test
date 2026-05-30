public class PaymentServiceTests
{
    [Fact]
    public void GetPaymentType_ShouldReturnCreditCard()
    {
        var service = new PaymentService();

        var result = service.GetPaymentType(1);

        Assert.Equal("CREDIT_CARD", result);
    }

    [Fact]
    public void GetPaymentType_ShouldReturnQrPayment()
    {
        var service = new PaymentService();

        var result = service.GetPaymentType(2);

        Assert.Equal("QR_PAYMENT", result);
    }

    [Fact]
    public void GetPaymentType_ShouldReturnUnknown_WhenInvalidCode()
    {
        var service = new PaymentService();

        var result = service.GetPaymentType(99);

        Assert.Equal("UNKNOWN", result);
    }
}