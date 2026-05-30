public class OrderServiceTests
{
    [Fact]
    public void ProcessOrder_ShouldThrowInvalidOperationException_WhenAlreadyProcessed()
    {
        var service = new OrderService();

        service.ProcessOrder();

        Assert.Throws<InvalidOperationException>(
            () => service.ProcessOrder());
    }
}