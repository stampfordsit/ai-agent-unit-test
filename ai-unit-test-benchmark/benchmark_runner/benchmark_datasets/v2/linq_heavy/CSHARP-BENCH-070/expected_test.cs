public class ProductServiceTests
{
    [Fact]
    public void CountByCategory_ShouldReturnCorrectCounts()
    {
        var products = new List<Product>
        {
            new Product { Category = "Electronics" },
            new Product { Category = "Electronics" },
            new Product { Category = "Books" }
        };

        var service = new ProductService();

        var result = service.CountByCategory(products);

        Assert.Equal(2, result["Electronics"]);
        Assert.Equal(1, result["Books"]);
    }
}