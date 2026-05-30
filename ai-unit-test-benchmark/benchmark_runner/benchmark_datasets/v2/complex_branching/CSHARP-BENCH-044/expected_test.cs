public class InventoryServiceTests
{
    [Fact]
    public void GetStockStatus_ShouldReturnInactive_WhenNotActive()
    {
        var service = new InventoryService();

        var result = service.GetStockStatus(90, true, false);

        Assert.Equal("INACTIVE", result);
    }

    [Fact]
    public void GetStockStatus_ShouldReturnVipGold_WhenVipAndScoreAbove90()
    {
        var service = new InventoryService();

        var result = service.GetStockStatus(95, true, true);

        Assert.Equal("VIP-GOLD", result);
    }

    [Fact]
    public void GetStockStatus_ShouldReturnVipSilver_WhenVipAndScoreAbove70()
    {
        var service = new InventoryService();

        var result = service.GetStockStatus(75, true, true);

        Assert.Equal("VIP-SILVER", result);
    }

    [Fact]
    public void GetStockStatus_ShouldReturnGold_WhenRegularScoreAbove80()
    {
        var service = new InventoryService();

        var result = service.GetStockStatus(85, false, true);

        Assert.Equal("GOLD", result);
    }

    [Fact]
    public void GetStockStatus_ShouldReturnBasic_WhenLowScore()
    {
        var service = new InventoryService();

        var result = service.GetStockStatus(40, false, true);

        Assert.Equal("BASIC", result);
    }
}