public class PaymentServiceTests
{
    [Fact]
    public void GetPaymentStatus_ShouldReturnInactive_WhenNotActive()
    {
        var service = new PaymentService();

        var result = service.GetPaymentStatus(90, true, false);

        Assert.Equal("INACTIVE", result);
    }

    [Fact]
    public void GetPaymentStatus_ShouldReturnVipGold_WhenVipAndScoreAbove90()
    {
        var service = new PaymentService();

        var result = service.GetPaymentStatus(95, true, true);

        Assert.Equal("VIP-GOLD", result);
    }

    [Fact]
    public void GetPaymentStatus_ShouldReturnVipSilver_WhenVipAndScoreAbove70()
    {
        var service = new PaymentService();

        var result = service.GetPaymentStatus(75, true, true);

        Assert.Equal("VIP-SILVER", result);
    }

    [Fact]
    public void GetPaymentStatus_ShouldReturnGold_WhenRegularScoreAbove80()
    {
        var service = new PaymentService();

        var result = service.GetPaymentStatus(85, false, true);

        Assert.Equal("GOLD", result);
    }

    [Fact]
    public void GetPaymentStatus_ShouldReturnBasic_WhenLowScore()
    {
        var service = new PaymentService();

        var result = service.GetPaymentStatus(40, false, true);

        Assert.Equal("BASIC", result);
    }
}