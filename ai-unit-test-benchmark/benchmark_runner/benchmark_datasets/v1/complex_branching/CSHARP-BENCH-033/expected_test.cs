public class ShippingServiceTests
{
    [Fact]
    public void GetShippingType_ShouldReturnInactive_WhenNotActive()
    {
        var service = new ShippingService();

        var result = service.GetShippingType(90, true, false);

        Assert.Equal("INACTIVE", result);
    }

    [Fact]
    public void GetShippingType_ShouldReturnVipGold_WhenVipAndScoreAbove90()
    {
        var service = new ShippingService();

        var result = service.GetShippingType(95, true, true);

        Assert.Equal("VIP-GOLD", result);
    }

    [Fact]
    public void GetShippingType_ShouldReturnVipSilver_WhenVipAndScoreAbove70()
    {
        var service = new ShippingService();

        var result = service.GetShippingType(75, true, true);

        Assert.Equal("VIP-SILVER", result);
    }

    [Fact]
    public void GetShippingType_ShouldReturnGold_WhenRegularScoreAbove80()
    {
        var service = new ShippingService();

        var result = service.GetShippingType(85, false, true);

        Assert.Equal("GOLD", result);
    }

    [Fact]
    public void GetShippingType_ShouldReturnBasic_WhenLowScore()
    {
        var service = new ShippingService();

        var result = service.GetShippingType(40, false, true);

        Assert.Equal("BASIC", result);
    }
}