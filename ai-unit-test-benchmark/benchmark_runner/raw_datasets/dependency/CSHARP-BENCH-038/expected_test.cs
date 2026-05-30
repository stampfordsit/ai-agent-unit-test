public class ProductServiceTests
{
    [Fact]
    public async Task GetProductsAsync_ShouldReturnProducts()
    {
        var repo = new Mock<IProductRepository>();

        var products = new List<Product>
        {
            new Product { Id = 1, Name = "Keyboard" },
            new Product { Id = 2, Name = "Mouse" }
        };

        repo.Setup(x => x.GetAllAsync())
            .ReturnsAsync(products);

        var service = new ProductService(repo.Object);

        var result = await service.GetProductsAsync();

        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Contains(result, x => x.Name == "Keyboard");
    }

    [Fact]
    public async Task GetProductsAsync_ShouldReturnEmptyList_WhenNoProducts()
    {
        var repo = new Mock<IProductRepository>();

        repo.Setup(x => x.GetAllAsync())
            .ReturnsAsync(new List<Product>());

        var service = new ProductService(repo.Object);

        var result = await service.GetProductsAsync();

        Assert.NotNull(result);
        Assert.Empty(result);
    }
}