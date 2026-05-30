public class InventoryServiceTests
{
    [Fact]
    public void RemoveStock_ShouldThrowException_WhenQuantityExceedsStock()
    {
        var service = new InventoryService();

        Assert.Throws<InvalidOperationException>(
            () => service.RemoveStock(5, 10));
    }
}