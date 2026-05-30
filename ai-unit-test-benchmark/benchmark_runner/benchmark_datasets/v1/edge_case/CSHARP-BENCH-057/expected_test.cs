public class CollectionServiceTests
{
    [Fact]
    public void GetFirstItem_ShouldThrowException_WhenListEmpty()
    {
        var service = new CollectionService();

        Assert.Throws<InvalidOperationException>(
            () => service.GetFirstItem(new List<int>()));
    }
}