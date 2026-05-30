public class SupportServiceTests
{
    [Fact]
    public void GetTicketPriority_ShouldReturnInactive_WhenNotActive()
    {
        var service = new SupportService();

        var result = service.GetTicketPriority(90, true, false);

        Assert.Equal("INACTIVE", result);
    }

    [Fact]
    public void GetTicketPriority_ShouldReturnVipGold_WhenVipAndScoreAbove90()
    {
        var service = new SupportService();

        var result = service.GetTicketPriority(95, true, true);

        Assert.Equal("VIP-GOLD", result);
    }

    [Fact]
    public void GetTicketPriority_ShouldReturnVipSilver_WhenVipAndScoreAbove70()
    {
        var service = new SupportService();

        var result = service.GetTicketPriority(75, true, true);

        Assert.Equal("VIP-SILVER", result);
    }

    [Fact]
    public void GetTicketPriority_ShouldReturnGold_WhenRegularScoreAbove80()
    {
        var service = new SupportService();

        var result = service.GetTicketPriority(85, false, true);

        Assert.Equal("GOLD", result);
    }

    [Fact]
    public void GetTicketPriority_ShouldReturnBasic_WhenLowScore()
    {
        var service = new SupportService();

        var result = service.GetTicketPriority(40, false, true);

        Assert.Equal("BASIC", result);
    }
}