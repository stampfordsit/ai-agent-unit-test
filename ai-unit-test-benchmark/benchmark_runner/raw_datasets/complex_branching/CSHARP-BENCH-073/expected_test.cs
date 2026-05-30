public class AttendanceServiceTests
{
    [Fact]
    public void GetAttendanceStatus_ShouldReturnInactive_WhenNotActive()
    {
        var service = new AttendanceService();

        var result = service.GetAttendanceStatus(90, true, false);

        Assert.Equal("INACTIVE", result);
    }

    [Fact]
    public void GetAttendanceStatus_ShouldReturnVipGold_WhenVipAndScoreAbove90()
    {
        var service = new AttendanceService();

        var result = service.GetAttendanceStatus(95, true, true);

        Assert.Equal("VIP-GOLD", result);
    }

    [Fact]
    public void GetAttendanceStatus_ShouldReturnVipSilver_WhenVipAndScoreAbove70()
    {
        var service = new AttendanceService();

        var result = service.GetAttendanceStatus(75, true, true);

        Assert.Equal("VIP-SILVER", result);
    }

    [Fact]
    public void GetAttendanceStatus_ShouldReturnGold_WhenRegularScoreAbove80()
    {
        var service = new AttendanceService();

        var result = service.GetAttendanceStatus(85, false, true);

        Assert.Equal("GOLD", result);
    }

    [Fact]
    public void GetAttendanceStatus_ShouldReturnBasic_WhenLowScore()
    {
        var service = new AttendanceService();

        var result = service.GetAttendanceStatus(40, false, true);

        Assert.Equal("BASIC", result);
    }
}