import pytest
from app.services.language_engine import detect_hybrid_language


@pytest.mark.asyncio
async def test_detect_english():
    text = "Hello everyone, my name is John and I want to improve my communication skills."
    result = await detect_hybrid_language(text)
    assert result["primary_language"] == "en"
    assert "English" in result["language_label"]


@pytest.mark.asyncio
async def test_detect_urdu_script():
    text = "میرا نام علی ہے اور میں اپنے بولنے کی صلاحیت کو بہتر بنانا چاہتا ہوں"
    result = await detect_hybrid_language(text)
    assert result["primary_language"] == "ur"
    assert "Urdu" in result["language_label"]


@pytest.mark.asyncio
async def test_detect_hindi_script():
    text = "नमस्ते, मेरा नाम राहुल है और मैं अपने आत्मविश्वास को बढ़ाना चाहता हूँ"
    result = await detect_hybrid_language(text)
    assert result["primary_language"] == "hi"
    assert "Hindi" in result["language_label"]


@pytest.mark.asyncio
async def test_detect_roman_urdu():
    text = "mera naam ahmed hai aur me interview ke liye practice kar raha hun"
    result = await detect_hybrid_language(text)
    assert result["primary_language"] in ["ur-Latn", "ur", "en"]
    assert "Roman Urdu" in result["language_label"] or "Urdu" in result["language_label"]


@pytest.mark.asyncio
async def test_detect_mixed_code_switching():
    text = "I am preparing for my job interview لیکن مجھے تھوڑی nervousness ہوتی ہے"
    result = await detect_hybrid_language(text)
    assert result["is_mixed"] is True or ("Mixed" in result["language_label"])
