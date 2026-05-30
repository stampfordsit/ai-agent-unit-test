public class CollectionServiceTests
{
    [Fact]
    public void RemoveDuplicates_ShouldReturnDistinctValues()
    {
        var service = new CollectionService();

        var values = new List<int>
        {
            1, 1, 2, 3, 3, 4
        };

        var result = service.RemoveDuplicates(values);

        Assert.Equal(4, result.Count);
        Assert.Contains(1, result);
        Assert.Contains(2, result);
        Assert.Contains(3, result);
        Assert.Contains(4, result);
    }
}