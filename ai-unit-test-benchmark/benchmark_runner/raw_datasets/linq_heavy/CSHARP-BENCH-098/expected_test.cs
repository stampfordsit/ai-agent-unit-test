public class ProductServiceTests
{
    [Fact]
    public void GetTotalPrice_ShouldReturnCorrectTotal()
    {
        var products = new List<Product>
        {
            new Product { Price = 100 },
            new Product { Price = 200 },
            new Product { Price = 300 }
        };

        var service = new ProductService();

        var result = service.GetTotalPrice(products);

        Assert.Equal(600, result);
    }
}