public class AccessServiceTests
{
    [Fact]
    public void GetAccessLevel_ShouldReturnInactive_WhenNotActive()
    {
        var service = new AccessService();

        var result = service.GetAccessLevel(90, true, false);

        Assert.Equal("INACTIVE", result);
    }

    [Fact]
    public void GetAccessLevel_ShouldReturnVipGold_WhenVipAndScoreAbove90()
    {
        var service = new AccessService();

        var result = service.GetAccessLevel(95, true, true);

        Assert.Equal("VIP-GOLD", result);
    }

    [Fact]
    public void GetAccessLevel_ShouldReturnVipSilver_WhenVipAndScoreAbove70()
    {
        var service = new AccessService();

        var result = service.GetAccessLevel(75, true, true);

        Assert.Equal("VIP-SILVER", result);
    }

    [Fact]
    public void GetAccessLevel_ShouldReturnGold_WhenRegularScoreAbove80()
    {
        var service = new AccessService();

        var result = service.GetAccessLevel(85, false, true);

        Assert.Equal("GOLD", result);
    }

    [Fact]
    public void GetAccessLevel_ShouldReturnBasic_WhenLowScore()
    {
        var service = new AccessService();

        var result = service.GetAccessLevel(40, false, true);

        Assert.Equal("BASIC", result);
    }
}