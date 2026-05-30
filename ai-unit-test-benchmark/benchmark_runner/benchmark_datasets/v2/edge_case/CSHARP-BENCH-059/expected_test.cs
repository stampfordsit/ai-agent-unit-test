public class PaymentServiceTests
{
    [Fact]
    public void ProcessPayment_ShouldReturnFalse_WhenAmountInvalid()
    {
        var service = new PaymentService();

        var result = service.ProcessPayment(0);

        Assert.False(result);
    }
}