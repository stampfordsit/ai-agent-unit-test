public class MembershipServiceTests
{
    [Fact]
    public void GetMembershipLevel_ShouldReturnZero_WhenAmountInvalid()
    {
        var service = new MembershipService();

        var result = service.GetMembershipLevel(0, false);

        Assert.Equal(0, result);
    }

    [Fact]
    public void GetMembershipLevel_ShouldReturnVipDiscount_WhenVipAndHighAmount()
    {
        var service = new MembershipService();

        var result = service.GetMembershipLevel(6000, true);

        Assert.Equal(1200, result);
    }

    [Fact]
    public void GetMembershipLevel_ShouldReturnStandardDiscount_WhenAmountAbove1000()
    {
        var service = new MembershipService();

        var result = service.GetMembershipLevel(2000, false);

        Assert.Equal(200, result);
    }

    [Fact]
    public void GetMembershipLevel_ShouldReturnBasicDiscount_WhenAmountBelow1000()
    {
        var service = new MembershipService();

        var result = service.GetMembershipLevel(500, false);

        Assert.Equal(25, result);
    }
}