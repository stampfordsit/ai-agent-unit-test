public class DeliveryServiceTests
{
    [Fact]
    public void GetDeliveryZone_ShouldReturnInactive_WhenNotActive()
    {
        var service = new DeliveryService();

        var result = service.GetDeliveryZone(90, true, false);

        Assert.Equal("INACTIVE", result);
    }

    [Fact]
    public void GetDeliveryZone_ShouldReturnVipGold_WhenVipAndScoreAbove90()
    {
        var service = new DeliveryService();

        var result = service.GetDeliveryZone(95, true, true);

        Assert.Equal("VIP-GOLD", result);
    }

    [Fact]
    public void GetDeliveryZone_ShouldReturnVipSilver_WhenVipAndScoreAbove70()
    {
        var service = new DeliveryService();

        var result = service.GetDeliveryZone(75, true, true);

        Assert.Equal("VIP-SILVER", result);
    }

    [Fact]
    public void GetDeliveryZone_ShouldReturnGold_WhenRegularScoreAbove80()
    {
        var service = new DeliveryService();

        var result = service.GetDeliveryZone(85, false, true);

        Assert.Equal("GOLD", result);
    }

    [Fact]
    public void GetDeliveryZone_ShouldReturnBasic_WhenLowScore()
    {
        var service = new DeliveryService();

        var result = service.GetDeliveryZone(40, false, true);

        Assert.Equal("BASIC", result);
    }
}