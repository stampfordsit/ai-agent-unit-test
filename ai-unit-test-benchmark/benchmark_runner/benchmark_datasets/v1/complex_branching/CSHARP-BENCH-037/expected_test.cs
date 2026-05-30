public class MembershipServiceTests
{
    [Fact]
    public void GetMembershipBenefits_ShouldReturnInactive_WhenNotActive()
    {
        var service = new MembershipService();

        var result = service.GetMembershipBenefits(90, true, false);

        Assert.Equal("INACTIVE", result);
    }

    [Fact]
    public void GetMembershipBenefits_ShouldReturnVipGold_WhenVipAndScoreAbove90()
    {
        var service = new MembershipService();

        var result = service.GetMembershipBenefits(95, true, true);

        Assert.Equal("VIP-GOLD", result);
    }

    [Fact]
    public void GetMembershipBenefits_ShouldReturnVipSilver_WhenVipAndScoreAbove70()
    {
        var service = new MembershipService();

        var result = service.GetMembershipBenefits(75, true, true);

        Assert.Equal("VIP-SILVER", result);
    }

    [Fact]
    public void GetMembershipBenefits_ShouldReturnGold_WhenRegularScoreAbove80()
    {
        var service = new MembershipService();

        var result = service.GetMembershipBenefits(85, false, true);

        Assert.Equal("GOLD", result);
    }

    [Fact]
    public void GetMembershipBenefits_ShouldReturnBasic_WhenLowScore()
    {
        var service = new MembershipService();

        var result = service.GetMembershipBenefits(40, false, true);

        Assert.Equal("BASIC", result);
    }
}