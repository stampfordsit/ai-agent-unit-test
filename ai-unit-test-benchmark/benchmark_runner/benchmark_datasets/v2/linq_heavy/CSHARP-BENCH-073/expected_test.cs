public class ProductServiceTests
{
    [Fact]
    public void FlattenTags_ShouldReturnDistinctTags()
    {
        var products = new List<Product>
        {
            new Product
            {
                Tags = new List<string>
                {
                    "tech",
                    "gaming"
                }
            },
            new Product
            {
                Tags = new List<string>
                {
                    "gaming",
                    "office"
                }
            }
        };

        var service = new ProductService();

        var result = service.FlattenTags(products);

        Assert.Equal(3, result.Count);
        Assert.Contains("tech", result);
        Assert.Contains("gaming", result);
        Assert.Contains("office", result);
    }
}