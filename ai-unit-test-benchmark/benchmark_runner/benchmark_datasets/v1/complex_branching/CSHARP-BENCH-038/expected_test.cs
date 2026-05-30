public class OrderServiceTests
{
    [Fact]
    public void GetOrderPriority_ShouldReturnInactive_WhenNotActive()
    {
        var service = new OrderService();

        var result = service.GetOrderPriority(90, true, false);

        Assert.Equal("INACTIVE", result);
    }

    [Fact]
    public void GetOrderPriority_ShouldReturnVipGold_WhenVipAndScoreAbove90()
    {
        var service = new OrderService();

        var result = service.GetOrderPriority(95, true, true);

        Assert.Equal("VIP-GOLD", result);
    }

    [Fact]
    public void GetOrderPriority_ShouldReturnVipSilver_WhenVipAndScoreAbove70()
    {
        var service = new OrderService();

        var result = service.GetOrderPriority(75, true, true);

        Assert.Equal("VIP-SILVER", result);
    }

    [Fact]
    public void GetOrderPriority_ShouldReturnGold_WhenRegularScoreAbove80()
    {
        var service = new OrderService();

        var result = service.GetOrderPriority(85, false, true);

        Assert.Equal("GOLD", result);
    }

    [Fact]
    public void GetOrderPriority_ShouldReturnBasic_WhenLowScore()
    {
        var service = new OrderService();

        var result = service.GetOrderPriority(40, false, true);

        Assert.Equal("BASIC", result);
    }
}