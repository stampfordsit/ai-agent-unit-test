public class OrderServiceTests
{
    [Fact]
    public void GetOrderStatus_ShouldReturnZero_WhenAmountInvalid()
    {
        var service = new OrderService();

        var result = service.GetOrderStatus(0, false);

        Assert.Equal(0, result);
    }

    [Fact]
    public void GetOrderStatus_ShouldReturnVipDiscount_WhenVipAndHighAmount()
    {
        var service = new OrderService();

        var result = service.GetOrderStatus(6000, true);

        Assert.Equal(1200, result);
    }

    [Fact]
    public void GetOrderStatus_ShouldReturnStandardDiscount_WhenAmountAbove1000()
    {
        var service = new OrderService();

        var result = service.GetOrderStatus(2000, false);

        Assert.Equal(200, result);
    }

    [Fact]
    public void GetOrderStatus_ShouldReturnBasicDiscount_WhenAmountBelow1000()
    {
        var service = new OrderService();

        var result = service.GetOrderStatus(500, false);

        Assert.Equal(25, result);
    }
}