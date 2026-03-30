# GAN Discriminator Taxonomy: Comprehensive Survey of Specialized Discriminator Architectures

## 1. Spatial Scope Discriminators

### 1.1 Global (Standard) Discriminator
- **What it evaluates:** Holistic image realism via a single scalar real/fake score
- **How it differs:** Baseline -- processes full image, outputs one probability value
- **Source:** Goodfellow et al., "Generative Adversarial Nets" (NeurIPS 2014)
- **Operates on:** Full output

### 1.2 PatchGAN (Markovian) Discriminator
- **What it evaluates:** Local texture and high-frequency detail realism per overlapping patch
- **How it differs:** Outputs a spatial probability map (NxN matrix) instead of a scalar; each value classifies a local receptive field (typically 70x70). Assumes Markov random field independence between distant patches.
- **Source:** Isola et al., "Image-to-Image Translation with Conditional Adversarial Networks" (pix2pix, CVPR 2017)
- **Operates on:** Overlapping local patches (not the full output holistically)

### 1.3 Multi-Scale Discriminator (Pix2PixHD)
- **What it evaluates:** Realism at multiple spatial resolutions simultaneously
- **How it differs:** Three identical PatchGAN discriminators (D1, D2, D3) operate on a resolution pyramid (1x, 0.5x, 0.25x). D1 captures fine details, D3 captures global structure. Avoids the need for extremely deep networks or large kernels.
- **Source:** Wang et al., "High-Resolution Image Synthesis and Semantic Manipulation with Conditional GANs" (Pix2PixHD, CVPR 2018)
- **Operates on:** Full output at three different downsampled scales

### 1.4 Global + Local Discriminator (GLCIC)
- **What it evaluates:** Global scene coherence and local inpainted region quality separately
- **How it differs:** Two discriminators: a global one takes the entire image; a local one takes only the sub-image around the filled/modified region. Combined to enforce both local texture and global consistency.
- **Source:** Iizuka et al., "Globally and Locally Consistent Image Completion" (SIGGRAPH 2017)
- **Operates on:** Full output (global) + specific region (local)

### 1.5 Skip Patch Discriminator
- **What it evaluates:** Both local and global structures through skip connections
- **How it differs:** Uses skip connections to give each output pixel access to patch sizes ranging from small to 70x70, detecting trends, symmetry, and asymmetry across a range of window sizes.
- **Source:** "GAN with Skip Patch Discriminator for Biological Electron Microscopy Image Generation" (2024)
- **Operates on:** Multiple patch sizes via skip connections

### 1.6 Statistical PatchGAN (SPatchGAN)
- **What it evaluates:** Distribution-level statistics of patches at multiple scales
- **How it differs:** Extracts channel-wise statistics (mean, max, stddev) over all patches at several scales, feeds them to scale-specific MLP heads. Matches statistical distributions rather than classifying individual patches. Better for tasks requiring large shape deformation.
- **Source:** "SPatchGAN" -- motivating adaptations for shape deformation tasks
- **Operates on:** Statistical aggregates across all patches at multiple scales


## 2. U-Net / Per-Pixel Discriminators

### 2.1 U-Net Discriminator
- **What it evaluates:** Per-pixel realism (via decoder) plus global coherence (via encoder bottleneck)
- **How it differs:** Borrows U-Net encoder-decoder with skip connections from segmentation literature. Provides dense per-pixel real/fake feedback while the bottleneck captures global structure. Enables CutMix-based per-pixel consistency regularization.
- **Source:** Schonfeld et al., "A U-Net Based Discriminator for Generative Adversarial Networks" (CVPR 2020)
- **Operates on:** Full output, providing both pixel-level and global feedback

### 2.2 Dual-Function Discriminator (VD-GAN)
- **What it evaluates:** Semantic alignment and segmentation quality simultaneously
- **How it differs:** Performs both adversarial discrimination and semantic segmentation in a single U-Net-based discriminator, ensuring consistency between generated images and semantic labels.
- **Source:** "Dual-function discriminator for semantic image synthesis in variational GANs" (Pattern Recognition, 2025)
- **Operates on:** Full output with per-pixel semantic feedback


## 3. Conditioning-Based Discriminators

### 3.1 Conditional Concatenation Discriminator (cGAN)
- **What it evaluates:** Whether image-label pairs are consistent (joint distribution matching)
- **How it differs:** Condition (class label, segmentation map, etc.) is concatenated to the input before or at early layers. Simplest conditioning approach.
- **Source:** Mirza & Osindero, "Conditional Generative Adversarial Nets" (2014)
- **Operates on:** Full output conditioned on auxiliary information

### 3.2 Auxiliary Classifier Discriminator (AC-GAN)
- **What it evaluates:** Real/fake discrimination AND class classification simultaneously
- **How it differs:** Discriminator has two output heads: one for real/fake, one for class prediction. Generator is trained to maximize correct classification while fooling the real/fake head. Known issue: low intra-class diversity as class count increases.
- **Source:** Odena et al., "Conditional Image Synthesis With Auxiliary Classifier GANs" (ICML 2017)
- **Operates on:** Full output, producing both adversarial and classification signals

### 3.3 Projection Discriminator
- **What it evaluates:** Whether the feature representation is consistent with the class embedding via inner product
- **How it differs:** Instead of concatenating class information, computes an inner product between class embedding and discriminator features. Theoretically grounded in the probabilistic model of conditional distributions. Significantly outperforms concatenation and AC-GAN on ImageNet.
- **Source:** Miyato & Koyama, "cGANs with Projection Discriminator" (ICLR 2018)
- **Operates on:** Full output features, conditioned via projection

### 3.4 Twin Auxiliary Classifier (TAC-GAN)
- **What it evaluates:** Class consistency while maintaining intra-class diversity
- **How it differs:** Adds a "twin" auxiliary classifier that provides complementary feedback to address AC-GAN's diversity collapse. Exploits Jensen-Shannon divergence properties when labels are uniform.
- **Source:** Gong et al., "Twin Auxiliary Classifiers GAN" (NeurIPS 2019)
- **Operates on:** Full output with dual classification heads

### 3.5 Dual Projection Discriminator (P2GAN)
- **What it evaluates:** Both data matching (Q(x|y) vs P(x|y)) and label matching
- **How it differs:** Extends projection discriminator with dual projections to enforce both conditional data matching and label distribution matching simultaneously.
- **Source:** "Dual Projection Generative Adversarial Networks for Conditional Image Generation" (ICCV 2021)
- **Operates on:** Full output with dual projection conditioning


## 4. Information-Theoretic Discriminators

### 4.1 InfoGAN Auxiliary Q-Network
- **What it evaluates:** Mutual information between latent control codes and generated output
- **How it differs:** Adds an auxiliary network Q (sharing weights with discriminator) that predicts the control codes used to generate an image. Maximizes mutual information to learn disentangled representations in a completely unsupervised manner.
- **Source:** Chen et al., "InfoGAN: Interpretable Representation Learning by Information Maximizing Generative Adversarial Nets" (NeurIPS 2016)
- **Operates on:** Full output, predicting latent codes

### 4.2 UAC-GAN (Mutual Information Neural Estimation)
- **What it evaluates:** Unbiased mutual information between generated data and labels
- **How it differs:** Uses MINE (Mutual Information Neural Estimation) instead of twin classifiers, providing theoretical guarantees while avoiding instability of dual classifier approaches.
- **Source:** Choi et al., "Unbiased Auxiliary Classifier GANs with MINE" (2020)
- **Operates on:** Full output with neural MI estimation


## 5. Loss-Function-Variant Discriminators

### 5.1 Wasserstein Critic (WGAN / WGAN-GP)
- **What it evaluates:** Wasserstein (Earth Mover's) distance between real and generated distributions
- **How it differs:** Renamed from "discriminator" to "critic" -- outputs an unbounded score (not probability). Constrained to be 1-Lipschitz via weight clipping (WGAN) or gradient penalty (WGAN-GP). Provides smoother gradients and meaningful loss curves. No batch normalization allowed with GP.
- **Source:** Arjovsky et al., "Wasserstein GAN" (ICML 2017); Gulrajani et al., "Improved Training of Wasserstein GANs" (NeurIPS 2017)
- **Operates on:** Full output, scoring rather than classifying

### 5.2 Relativistic Discriminator (RSGAN / RaGAN)
- **What it evaluates:** Probability that real data is MORE realistic than fake data (and vice versa)
- **How it differs:** Standard discriminators estimate P(real). Relativistic discriminators estimate P(real data is more realistic than fake data). RaGAN variant compares against batch averages for lower variance. Subsumes IPM-based GANs. 4x faster convergence than WGAN-GP. Can be applied with any activation function.
- **Source:** Jolicoeur-Martineau, "The relativistic discriminator: a key element missing from standard GAN" (ICLR 2019)
- **Operates on:** Full output, comparing real-fake pairs or batch statistics

### 5.3 Least Squares Discriminator (LSGAN)
- **What it evaluates:** Same as standard, but uses L2 loss instead of cross-entropy
- **How it differs:** Replaces BCE with least-squares loss to address vanishing gradients. Penalizes samples proportionally to their distance from the decision boundary.
- **Source:** Mao et al., "Least Squares Generative Adversarial Networks" (ICCV 2017)
- **Operates on:** Full output

### 5.4 Hinge Loss Discriminator
- **What it evaluates:** Standard real/fake but with margin-based loss
- **How it differs:** Uses hinge loss (max(0, 1-D(x)) for real, max(0, 1+D(x)) for fake). Used in SAGAN, BigGAN, SPADE. Provides strong training signal without saturating.
- **Source:** Lim & Ye, "Geometric GAN" (2017); adopted by Zhang et al. (SAGAN), Brock et al. (BigGAN)
- **Operates on:** Full output


## 6. Attention and Transformer Discriminators

### 6.1 Self-Attention Discriminator (SAGAN)
- **What it evaluates:** Long-range spatial dependencies and consistency of distant features
- **How it differs:** Adds self-attention layers at intermediate feature maps (32x32) so the discriminator can check that features in distant image regions are mutually consistent. Combined with spectral normalization on all layers and TTUR (separate learning rates).
- **Source:** Zhang et al., "Self-Attention Generative Adversarial Networks" (ICML 2019)
- **Operates on:** Full output with attention-weighted global context

### 6.2 Vision Transformer (ViT) Discriminator (ViTGAN)
- **What it evaluates:** Global image realism using pure transformer architecture
- **How it differs:** Uses vanilla ViT as discriminator. Requires special stabilization: improved spectral normalization and L2 attention to prevent training volatility. No batch normalization.
- **Source:** Lee et al., "ViTGAN: Training GANs with Vision Transformers" (ICLR 2022)
- **Operates on:** Full output via patch tokenization and self-attention

### 6.3 Multi-Scale Transformer Discriminator (TransGAN)
- **What it evaluates:** Semantic context and low-level textures at multiple scales, convolution-free
- **How it differs:** Pure transformer (no convolutions). Uses grid self-attention for memory efficiency. Stabilized with gradient penalty, data augmentation, and relative position encoding.
- **Source:** Jiang et al., "TransGAN: Two Pure Transformers Can Make One Strong GAN" (NeurIPS 2021)
- **Operates on:** Full output at multiple transformer scales

### 6.4 Swin Transformer Discriminator (StyleSwin, STransGAN)
- **What it evaluates:** Hierarchical visual features using shifted window attention
- **How it differs:** Uses Swin Transformer blocks. STransGAN found that residual connections dominate information flow, requiring skip-projection layers to fix.
- **Source:** Zhang et al., "StyleSwin" (CVPR 2022); "STransGAN" empirical study
- **Operates on:** Full output with hierarchical windowed attention


## 7. Pretrained-Feature Discriminators

### 7.1 Projected GAN Discriminator
- **What it evaluates:** Whether generated images match real images in pretrained feature spaces at multiple depths
- **How it differs:** Projects both real and fake images into a fixed pretrained network (e.g., EfficientNet) and feeds features from four resolution levels (64^2 to 8^2) into separate lightweight discriminators. Uses random Cross-Channel Mixing (CCM) and Cross-Scale Mixing (CSM) projectors that are fixed (not trained). 40x faster convergence than prior methods.
- **Source:** Sauer et al., "Projected GANs Converge Faster" (NeurIPS 2021)
- **Operates on:** Pretrained feature projections at multiple scales

### 7.2 Vision-Aided GAN Discriminator
- **What it evaluates:** Image quality using an ensemble of off-the-shelf pretrained vision models
- **How it differs:** Uses pretrained models (CLIP, DINO, classifiers) as additional discriminators via trainable classifier heads on frozen features. Selects the most effective pretrained models via linear probing of real/fake separability and progressively adds them to the ensemble.
- **Source:** Kumari et al., "Ensembling Off-the-shelf Models for GAN Training" (CVPR 2022 Oral)
- **Operates on:** Pretrained feature embeddings from multiple vision models

### 7.3 Perceptual Discriminator
- **What it evaluates:** Image realism based on perceptual statistics from a reference network
- **How it differs:** Bases the discriminator on perceptual features from a pretrained reference network rather than learning features from scratch. Benefits from robustness of perceptual losses while maintaining adversarial training. Can work on unaligned datasets.
- **Source:** Zakharov et al., "Image Manipulation with Perceptual Discriminators" (2019)
- **Operates on:** Perceptual feature statistics of the full output


## 8. Feature-Matching and Perceptual-Loss Discriminators

### 8.1 Feature Matching Discriminator
- **What it evaluates:** Whether intermediate discriminator features of generated images match those of real images
- **How it differs:** Not a separate architecture but a training technique: generator is optimized to match expected feature activations at intermediate discriminator layers rather than maximizing discriminator output. Stabilizes training by providing a smoother objective.
- **Source:** Salimans et al., "Improved Techniques for Training GANs" (NeurIPS 2016)
- **Operates on:** Intermediate features of the discriminator (not just final output)

### 8.2 Discriminator Perceptual Loss
- **What it evaluates:** Feature similarity using the discriminator as a learned perceptual feature extractor
- **How it differs:** Uses intermediate features of the trained discriminator (instead of VGG) to compute perceptual distance between real and generated images. The discriminator learns task-specific features that may be richer than generic VGG features.
- **Source:** "Gram-GAN: Image Super-Resolution Based on Gram Matrix and Discriminator Perceptual Loss" (Sensors, 2023)
- **Operates on:** Intermediate discriminator features as perceptual representation


## 9. Temporal / Video Discriminators

### 9.1 Spatial + Temporal Dual Discriminators (DVD-GAN)
- **What it evaluates:** Spatial realism per frame AND temporal consistency across frames separately
- **How it differs:** Two separate discriminators: spatial discriminator evaluates individual frames; temporal discriminator evaluates sequences of frames for motion coherence and temporal consistency.
- **Source:** Clark et al., "Adversarial Video Generation on Complex Datasets" (DVD-GAN, 2019)
- **Operates on:** Individual frames (spatial) + frame sequences (temporal)

### 9.2 Spatio-Temporal Discriminator (TecoGAN)
- **What it evaluates:** Temporal coherence using triplets of consecutive frames
- **How it differs:** Takes triplets of frames (t-1, t, t+1) as input. Uses a ping-pong loss for temporal coherence. Replaces simple L2 temporal losses with learned spatio-temporal objectives.
- **Source:** Chu et al., "Learning Temporal Coherence via Self-Supervision for GAN-based Video Generation" (TecoGAN, 2020)
- **Operates on:** Temporal triplets of consecutive frames

### 9.3 3D Convolutional Discriminator (HRVGAN)
- **What it evaluates:** Joint spatio-temporal coherence using volumetric convolutions
- **How it differs:** Uses 3D convolutional layers to process video as a volume, jointly modeling spatial and temporal dimensions. Feature vectors normalized at every voxel.
- **Source:** Matthey et al., "HRVGAN: High Resolution Video Generation using Spatio-Temporal GAN" (2020)
- **Operates on:** Full video volume (3D)

### 9.4 Two-Stream Discriminator (EncGAN3)
- **What it evaluates:** Content (temporally invariant) and movement (temporally variant) streams separately
- **How it differs:** Decomposes video into content and motion streams. Discriminator compares probabilistic representations of both streams against real video statistics.
- **Source:** EncGAN3 architecture
- **Operates on:** Decomposed content and motion streams

### 9.5 ConvLSTM Discriminator (RL-V2V-GAN)
- **What it evaluates:** Temporal dynamics using recurrent processing
- **How it differs:** Uses ConvLSTM layers in the discriminator to capture temporal dependencies through recurrent state, rather than 3D convolutions.
- **Source:** "Video to Video Generative Adversarial Network for Few-shot Learning Based on Policy Gradient" (2024)
- **Operates on:** Sequential frames via recurrent processing

### 9.6 Temporal Cubic PatchGAN (TCuP-GAN)
- **What it evaluates:** Local volumetric realism in 3D medical data
- **How it differs:** 3D convolutional PatchGAN (kernel 1x3x3) that outputs a 3x3 grid per z-slice. Each output unit is associated with a cubic local volume, enforcing spatial coherence across the depth axis.
- **Source:** TCuP-GAN for medical volumetric segmentation
- **Operates on:** Local 3D cubic volumes


## 10. Audio / Waveform Discriminators

### 10.1 Multi-Scale Discriminator (MSD) -- Audio
- **What it evaluates:** Audio structure at different temporal resolutions
- **How it differs:** Three sub-discriminators operate on waveforms at different downsampled scales (1x, 2x, 4x average pooling). Captures local texture to global continuity.
- **Source:** Kumar et al., "MelGAN" (NeurIPS 2019)
- **Operates on:** Waveform at multiple temporal scales

### 10.2 Multi-Period Discriminator (MPD)
- **What it evaluates:** Periodic patterns in audio at different fundamental periods
- **How it differs:** Reshapes 1D waveform into 2D representations using prime-number periods (2, 3, 5, 7, 11). Each sub-discriminator captures sinusoidal patterns at a different period. Critical for speech quality.
- **Source:** Kong et al., "HiFi-GAN" (NeurIPS 2020)
- **Operates on:** Periodic sub-samples of the waveform

### 10.3 Multi-Resolution Discriminator (MRD) -- Audio
- **What it evaluates:** Spectral sharpness and pitch accuracy across time-frequency resolutions
- **How it differs:** Operates on STFT spectrograms at multiple resolutions (different FFT sizes, hop lengths, window lengths). Complements MPD by providing frequency-domain evaluation.
- **Source:** You et al., "GAN Vocoder: Multi-Resolution Discriminator Is All You Need" (Interspeech 2021); used in UnivNet, BigVGAN
- **Operates on:** Multi-resolution STFT spectrograms

### 10.4 Multi-Envelope Discriminator (MED)
- **What it evaluates:** Temporal envelope dynamics of audio
- **How it differs:** Focuses on time-domain amplitude envelope characteristics. Combined with MRD for complementary time-domain and frequency-domain feedback.
- **Source:** BemaGANv2 (2025)
- **Operates on:** Temporal envelope of the waveform

### 10.5 Universal Harmonic Discriminator (UnivHD)
- **What it evaluates:** Harmonic structure in synthesized speech/singing
- **How it differs:** Uses STFT followed by learnable band-pass filter banks designed to capture harmonic patterns. Addresses the limitation of fixed-resolution STFT for signals with varying pitch.
- **Source:** "A Universal Harmonic Discriminator for High-quality GAN-based Vocoder" (2024)
- **Operates on:** Harmonic-filtered STFT representations

### 10.6 Multi-Scale Sub-Band CQT / Wavelet Discriminators
- **What it evaluates:** Frequency content with resolution adapted to musical/vocal pitch
- **How it differs:** Uses Constant-Q Transform (logarithmic frequency resolution) or Continuous Wavelet Transform instead of STFT, which has constant resolution. Better for singing voices and music where pitch varies widely.
- **Source:** "An Investigation of Time-Frequency Representation Discriminators for High-Fidelity Vocoder" (2024)
- **Operates on:** CQT or CWT spectrograms at multiple scales


## 11. Frequency / Spectral Domain Discriminators (Image)

### 11.1 Spectral (Fourier) Discriminator
- **What it evaluates:** Frequency spectrum fidelity, especially high-frequency content
- **How it differs:** Computes Fourier transform of input, then azimuthal integration to get 1D spectral profile. A separate FC+Sigmoid network discriminates real vs fake in frequency domain. Addresses the frequency bias where standard discriminators miss high-frequency details due to downsampling layers.
- **Source:** Jung & Keuper, "Spectral Distribution Aware Image Generation" (AAAI 2021)
- **Operates on:** Fourier magnitude spectrum (1D azimuthal projection)

### 11.2 SSD-GAN (Spatial + Spectral Discriminator)
- **What it evaluates:** Realness in both spatial and spectral domains simultaneously
- **How it differs:** Embeds a frequency-aware classifier alongside the standard spatial discriminator. Uses DFT to feed frequency representations to a spectral classifier. General-purpose module that can be added to any GAN.
- **Source:** Chen et al., "SSD-GAN: Measuring the Realness in the Spatial and Spectral Domains" (2020)
- **Operates on:** Spatial features (standard) + spectral features (DFT)


## 12. Ensemble and Multi-Discriminator Architectures

### 12.1 Generative Multi-Adversarial Network (GMAN)
- **What it evaluates:** Multiple independent assessments of image quality from different perspectives
- **How it differs:** Extends GANs to multiple independent discriminators with roles ranging from "formidable adversary" to "forgiving teacher." Produces higher quality samples in fewer iterations.
- **Source:** Durugkar et al., "Generative Multi-Adversarial Networks" (ICLR 2017)
- **Operates on:** Full output via multiple independent discriminators

### 12.2 MCL-GAN (Multiple Specialized Discriminators)
- **What it evaluates:** Different subsets of the data distribution via specialized discriminators
- **How it differs:** Each discriminator develops expertise in a subset of the data (inspired by multiple choice learning). Shared backbone keeps cost marginal. Mitigates mode collapse through specialization.
- **Source:** "MCL-GAN: Generative Adversarial Networks with Multiple Specialized Discriminators" (2021)
- **Operates on:** Full output, each discriminator specializing in a data subset

### 12.3 Dropout-GAN (Dynamic Ensemble)
- **What it evaluates:** Robustness across a dynamic ensemble of discriminator opinions
- **How it differs:** Uses adversarial dropout to randomly drop discriminator feedback each batch. Forces generator to satisfy a changing ensemble, promoting variety and avoiding mode collapse.
- **Source:** Mordido & Yang, "Dropout-GAN: Learning from a Dynamic Ensemble of Discriminators" (2018)
- **Operates on:** Full output via stochastically selected discriminator subset

### 12.4 Lightweight Ensemble Discriminator
- **What it evaluates:** Multiple discriminative signals at different feature depths within a single CNN
- **How it differs:** Embeds multiple discriminators at different intermediate layers of one deep CNN. Ensures diversity through scale-based differentiation while keeping computational cost low.
- **Source:** "A lightweight ensemble discriminator for Generative Adversarial Networks" (Knowledge-Based Systems, 2022)
- **Operates on:** Features at different depths of a single CNN


## 13. Diversity-Promoting Discriminators

### 13.1 Minibatch Discrimination
- **What it evaluates:** Diversity within a batch of generated samples
- **How it differs:** Augments the discriminator with a layer that computes pairwise feature distances across the batch. If generated samples are too similar in feature space, the discriminator penalizes the generator. Directly addresses mode collapse.
- **Source:** Salimans et al., "Improved Techniques for Training GANs" (NeurIPS 2016)
- **Operates on:** Batch-level statistics (not individual samples)

### 13.2 Minibatch Standard Deviation (ProGAN/StyleGAN)
- **What it evaluates:** Statistical variation within a batch
- **How it differs:** Appends a minibatch stddev layer near the end of the discriminator that computes the standard deviation across the batch and appends it as an extra feature channel. Simpler than full minibatch discrimination.
- **Source:** Karras et al., "Progressive Growing of GANs" (ICLR 2018); retained in StyleGAN
- **Operates on:** Batch statistics appended to feature maps

### 13.3 PacGAN (Packed Discriminator)
- **What it evaluates:** Joint quality of multiple samples simultaneously
- **How it differs:** Discriminator receives m "packed" samples at once instead of one. Makes mode collapse much more detectable since lack of diversity is obvious in sets. Achieves full mode coverage (1000/1000 modes) where standard DCGAN captures ~99.
- **Source:** Lin et al., "PacGAN: The power of two samples in generative adversarial networks" (NeurIPS 2018)
- **Operates on:** Packed sets of m samples jointly

### 13.4 Unrolled Discriminator
- **What it evaluates:** Standard real/fake, but generator "sees" future discriminator states
- **How it differs:** Generator objective is computed with respect to an unrolled (K-step lookahead) optimization of the discriminator. Prevents the mode-hopping cycle by anticipating counterplay. More computationally expensive.
- **Source:** Metz et al., "Unrolled Generative Adversarial Networks" (ICLR 2017)
- **Operates on:** Full output (discriminator is standard; the training procedure differs)


## 14. Contrastive Discriminators

### 14.1 ContraD (Contrastive Discriminator)
- **What it evaluates:** Representation quality via contrastive learning (SimCLR-based), with adversarial head on top
- **How it differs:** Discriminator representation is NOT learned from the discriminator loss but from two contrastive losses (one for real samples, one for fake). The actual real/fake classifier is a 2-layer MLP on the contrastive features. Enables much stronger augmentations without instability. Byproduct: learned features enable conditional generation without labels.
- **Source:** Jeong & Shin, "Training GANs with Stronger Augmentations via Contrastive Discriminator" (ICLR 2021)
- **Operates on:** Full output via contrastive feature learning

### 14.2 ContraGAN (Conditional Contrastive)
- **What it evaluates:** Data-to-data relations conditioned on class labels
- **How it differs:** Uses a conditional contrastive loss (2C loss) that pulls embeddings closer when class labels match and pushes apart otherwise. Operates on intra-batch relationships.
- **Source:** Kang et al., "ContraGAN: Contrastive Learning for Conditional Image Generation" (NeurIPS 2020)
- **Operates on:** Batch-level class-conditional embedding relations

### 14.3 Dual Contrastive Loss Discriminator
- **What it evaluates:** Two complementary contrastive objectives for generation quality
- **How it differs:** Case I: disassociates one real image from a batch of fakes. Case II (dual): disassociates one fake image from a batch of reals. Produces more distinguishable features than standard discriminator features.
- **Source:** Yu et al., "Dual Contrastive Loss and Attention for GANs" (ICCV 2021)
- **Operates on:** Batch-level contrastive pairs in both directions


## 15. Discriminator Augmentation Strategies

### 15.1 Adaptive Discriminator Augmentation (ADA)
- **What it evaluates:** Standard real/fake, but with stochastic augmentations to prevent overfitting
- **How it differs:** Applies non-leaking differentiable augmentations to both real and fake images with probability p < 1. Adaptively adjusts p during training by monitoring discriminator overfitting (discriminator accuracy on reals). Eliminates need for augmentation hyperparameter search.
- **Source:** Karras et al., "Training Generative Adversarial Networks with Limited Data" (StyleGAN2-ADA, NeurIPS 2020)
- **Operates on:** Augmented versions of the full output

### 15.2 Differentiable Augmentation (DiffAugment)
- **What it evaluates:** Standard real/fake with differentiable augmentations applied to both real and fake for both G and D updates
- **How it differs:** Applies the same deterministic differentiable augmentation (color, translation, cutout) to both real and generated images in both generator and discriminator training steps. Prevents discriminator memorization of limited training data.
- **Source:** Zhao et al., "Differentiable Augmentation for Data-Efficient GAN Training" (NeurIPS 2020)
- **Operates on:** Differentiably augmented full output


## 16. Encoder-Aware Discriminators

### 16.1 Joint Data-Latent Discriminator (BiGAN / ALI)
- **What it evaluates:** Whether (data, latent) pairs come from the encoder or the generator
- **How it differs:** Instead of just discriminating data x, it discriminates joint pairs (x, z). Compares (real_data, encoder(real_data)) vs (generator(z), z). Forces encoder and generator to be mutual inverses. No explicit reconstruction loss needed.
- **Source:** Donahue et al., "Adversarial Feature Learning" (BiGAN, ICLR 2017); Dumoulin et al., "Adversarially Learned Inference" (ALI, ICLR 2017)
- **Operates on:** Joint (data, latent_code) pairs

### 16.2 BigBiGAN Discriminator
- **What it evaluates:** Joint data-latent pairs at scale using BigGAN infrastructure
- **How it differs:** Scales up BiGAN with BigGAN generator. Achieves state-of-the-art unsupervised representation learning on ImageNet.
- **Source:** Donahue & Simonyan, "Large Scale Adversarial Representation Learning" (BigBiGAN, NeurIPS 2019)
- **Operates on:** Joint (data, latent) pairs at ImageNet scale


## 17. Normalization Techniques in Discriminators

### 17.1 Spectral Normalization
- **What it evaluates:** (Not a discriminator type, but a universal technique)
- **How it differs:** Constrains each layer's weight matrix to have spectral norm = 1, enforcing 1-Lipschitz continuity. Simpler and more stable than gradient penalty. Used in SNGAN, SAGAN, BigGAN, SPADE, ProjectedGAN, etc.
- **Source:** Miyato et al., "Spectral Normalization for Generative Adversarial Networks" (ICLR 2018)
- **Applies to:** Any discriminator architecture


## 18. Progressive / Growing Discriminators

### 18.1 Progressive Discriminator (ProGAN)
- **What it evaluates:** Image realism at progressively increasing resolutions
- **How it differs:** Starts with 4x4 resolution, gradually adds layers for 8x8, 16x16, ..., up to 1024x1024. New layers are faded in smoothly. Mirrors the progressive generator. Includes equalized learning rate and minibatch stddev.
- **Source:** Karras et al., "Progressive Growing of GANs for Improved Quality, Stability, and Variation" (ICLR 2018)
- **Operates on:** Full output at the current training resolution

### 18.2 Hierarchical Discriminator (LAPGAN)
- **What it evaluates:** Realism at each level of a Laplacian image pyramid
- **How it differs:** Separate generator and discriminator at each pyramid level. Each discriminator evaluates residuals at its scale. Coarse-to-fine generation with independent adversarial training per level.
- **Source:** Denton et al., "Deep Generative Image Models using a Laplacian Pyramid of Adversarial Networks" (LAPGAN, NeurIPS 2015)
- **Operates on:** Laplacian pyramid residuals at each scale


## 19. Dual / Task-Split Discriminators

### 19.1 D2GAN (Dual Discriminator -- KL/Reverse-KL)
- **What it evaluates:** Two complementary divergence measures simultaneously
- **How it differs:** D1 rewards high scores for real data (KL divergence); D2 rewards high scores for generated data (reverse KL divergence). The complementary statistical properties capture multi-modal distributions effectively.
- **Source:** Nguyen et al., "Dual Discriminator Generative Adversarial Nets" (NeurIPS 2017)
- **Operates on:** Full output via two discriminators with complementary objectives

### 19.2 DDcGAN (Dual-Discriminator for Image Fusion)
- **What it evaluates:** Structure similarity to two different source modalities
- **How it differs:** Generator produces a fused image; D1 compares fused vs source-1 (e.g., infrared); D2 compares fused vs source-2 (e.g., visible). Each discriminator ensures the fusion preserves its respective modality's characteristics.
- **Source:** Ma et al., "DDcGAN: A Dual-Discriminator Conditional GAN for Multi-Resolution Image Fusion" (2020)
- **Operates on:** Full fused output compared against two different source images

### 19.3 Edge + Holistic Dual Discriminator (PIDD-GAN)
- **What it evaluates:** Overall image reconstruction AND edge information separately
- **How it differs:** One discriminator for holistic image quality; another specifically for edge/boundary enhancement. Used in MRI reconstruction.
- **Source:** "Edge-enhanced dual discriminator generative adversarial network for fast MRI" (2021)
- **Operates on:** Full image (holistic D) + edge maps (edge D)


## 20. Domain / Cycle Discriminators

### 20.1 Domain-Specific Discriminators (CycleGAN)
- **What it evaluates:** Whether an image looks realistic in its target domain
- **How it differs:** Two discriminators, one per domain (D_X and D_Y). Each only evaluates whether images look like they belong to its specific domain. Combined with cycle consistency and identity losses.
- **Source:** Zhu et al., "Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networks" (CycleGAN, ICCV 2017)
- **Operates on:** Full output, one discriminator per domain

### 20.2 Discriminator-Feature Cycle Consistency
- **What it evaluates:** Structural similarity in discriminator feature space (not pixel space)
- **How it differs:** Instead of enforcing pixel-level cycle reconstruction, enforces L1 loss on CNN features extracted by the discriminator. Allows weaker but more semantically meaningful cycle consistency.
- **Source:** "CycleGAN with Better Cycles" (2024)
- **Operates on:** Discriminator intermediate features for cycle loss


## 21. Fairness-Aware Discriminators

### 21.1 FairGAN Protected-Attribute Discriminator
- **What it evaluates:** Whether the protected attribute (e.g., race, gender) can be predicted from generated data
- **How it differs:** D1 is standard (real/fake). D2 tries to predict the protected attribute from generated samples. Generator plays adversarial game against both: fool D1 and prevent D2 from predicting the protected attribute.
- **Source:** Xu et al., "FairGAN: Fairness-aware Generative Adversarial Networks" (2018)
- **Operates on:** Full output, with separate fairness evaluation

### 21.2 FairGAN+ Triple Discriminator
- **What it evaluates:** Real/fake + protected attribute + classification fairness
- **How it differs:** Three discriminators: D1 (real/fake), D2 (protected attribute prediction), D3 (classification fairness for downstream tasks).
- **Source:** Xu et al., "FairGAN+" (2019)
- **Operates on:** Full output with three discriminator objectives


## 22. Energy-Based and Sampling-Aware Discriminators

### 22.1 Discriminator as Energy-Based Model
- **What it evaluates:** An energy landscape over the data space
- **How it differs:** Reinterprets the discriminator output as defining an energy function. The sum of generator log-density + discriminator logit yields the true data density when D is optimal. Enables Langevin MCMC sampling in latent space (DDLS) or rejection sampling (DRS) to improve sample quality post-training.
- **Source:** Che et al., "Your GAN is Secretly an Energy-based Model and You Should Use Discriminator Driven Latent Sampling" (NeurIPS 2020); Azadi et al., "Discriminator Rejection Sampling" (ICLR 2019)
- **Operates on:** Full output, reinterpreted as energy scores


## 23. 3D / Volumetric Discriminators

### 23.1 3D CNN Discriminator (3D-GAN)
- **What it evaluates:** Voxel occupancy grid realism
- **How it differs:** Uses 3D convolutions on voxel grids, mirroring the 3D transposed convolutions in the generator. Limited by voxel resolution and memory.
- **Source:** Wu et al., "Learning a Probabilistic Latent Space of Object Shapes via 3D Generative-Adversarial Modeling" (3D-GAN, NeurIPS 2016)
- **Operates on:** Full 3D voxel grid

### 23.2 PointNet-Based Discriminator (Point Cloud GAN)
- **What it evaluates:** Point cloud distribution realism
- **How it differs:** Uses PointNet/PointNet++ architecture to process unordered point sets. Critical design choice: sampling sensitivity matters -- PointNet-Max causes clustering artifacts, PointNet++ is oversensitive. PointNet-Mix achieves the best balance.
- **Source:** Li et al., "Point Cloud GAN" (ICLR 2019); "Rethinking Sampling in 3D Point Cloud Generative Adversarial Networks" (2020)
- **Operates on:** Point cloud (unordered 3D points)

### 23.3 Graph Convolutional Discriminator (MolGAN)
- **What it evaluates:** Molecular graph validity and realism
- **How it differs:** Uses relational graph convolutions (considering edge/bond types) to process molecular graphs. Combined with RL reward network for property optimization (drug-likeness, synthesizability).
- **Source:** Cao & Kipf, "MolGAN: An implicit generative model for small molecular graphs" (2018)
- **Operates on:** Full molecular graph (nodes=atoms, edges=bonds)

### 23.4 Graph Transformer Discriminator (DrugGEN)
- **What it evaluates:** Drug candidate molecular graphs against target-specific bioactive molecules
- **How it differs:** Uses graph transformer encoder in the discriminator. Compares generated molecules against real inhibitors of specific protein targets.
- **Source:** "DrugGEN: Target Specific De Novo Design of Drug Candidate Molecules with Graph Transformer-based GANs" (2023)
- **Operates on:** Molecular graph via graph transformer

### 23.5 Hierarchical Graph Pooling Discriminator (DiPol-GAN)
- **What it evaluates:** Molecular graph quality with hierarchical node aggregation
- **How it differs:** Uses DIFFPOOL to learn hierarchical graph representations. Improves classification accuracy and graph embedding quality, which in turn pushes generator quality.
- **Source:** Guarino et al., "DiPol-GAN: Generating Molecular Graphs" (2019)
- **Operates on:** Molecular graph with learned hierarchical pooling


## 24. Text / Sequence Discriminators

### 24.1 CNN Sequence Discriminator (SeqGAN)
- **What it evaluates:** Whether a text sequence is real or generated
- **How it differs:** Uses CNN with multiple kernel sizes over token embeddings, max-pooling over time, and sigmoid classification. Combined with REINFORCE policy gradient since text is discrete and non-differentiable. Reward signal only available after complete sequence generation.
- **Source:** Yu et al., "SeqGAN: Sequence Generative Adversarial Nets with Policy Gradient" (AAAI 2017)
- **Operates on:** Complete text sequences

### 24.2 Language Model Discriminator (DP-GAN)
- **What it evaluates:** Sequence quality using language model perplexity as reward
- **How it differs:** Replaces the binary classifier discriminator with a language model that provides richer reward signals than simple real/fake classification. Better captures novelty and quality of generated text.
- **Source:** Xu et al., "Diversity-Promoting GAN: A Cross-Entropy Based GAN for Diversified Text Generation" (EMNLP 2018)
- **Operates on:** Complete text sequences with per-token LM feedback

### 24.3 Feature-Matching Text Discriminator (TextGAN)
- **What it evaluates:** Distribution-level statistics in latent feature space
- **How it differs:** Uses kernel-based moment matching over RKHS to compare empirical distributions of real and synthetic sentences in feature space, rather than binary classification. Reduces mode collapse.
- **Source:** "Adversarial Feature Matching for Text Generation" (ICML 2017)
- **Operates on:** Sentence-level feature distributions


## 25. Distributed / Federated Discriminators

### 25.1 Multi-Discriminator Distributed GAN (MD-GAN)
- **What it evaluates:** Data quality when training data is spread across multiple workers
- **How it differs:** Multiple discriminators, each on a different worker node with local data. Reduces per-worker learning complexity by 2x while maintaining quality. First solution for training GANs on distributed datasets.
- **Source:** Hardy et al., "MD-GAN: Multi-Discriminator Generative Adversarial Networks for Distributed Datasets" (2018)
- **Operates on:** Local data subsets on distributed workers


## 26. Cooperative / Compression Discriminators

### 26.1 Selective Activation Discriminator (GCC)
- **What it evaluates:** Real/fake classification with adaptive channel activation
- **How it differs:** During GAN compression, automatically selects and activates convolutional channels based on local capacity and global coordination constraints. Maintains Nash equilibrium with a lightweight compressed generator. Prevents mode collapse during compression.
- **Source:** Li et al., "Revisiting Discriminator in GAN Compression: A Generator-discriminator Cooperative Compression Scheme" (NeurIPS 2021)
- **Operates on:** Full output with adaptive channel selection


---

## Summary Table: Discriminator Taxonomy by Evaluation Dimension

| Dimension | Representative Types | What They Evaluate |
|-----------|---------------------|-------------------|
| Spatial scope | PatchGAN, Multi-Scale, Global+Local, U-Net | Local vs global realism |
| Resolution | Progressive, LAPGAN, Pix2PixHD | Quality at each resolution level |
| Conditioning | Projection, AC-GAN, cGAN, TAC-GAN | Class/label consistency |
| Information | InfoGAN Q-net, UAC-GAN | Disentanglement, MI |
| Loss formulation | Wasserstein, Relativistic, Hinge, LS | Training stability, gradient quality |
| Attention | SAGAN, ViTGAN, TransGAN | Long-range dependencies |
| Pretrained features | ProjectedGAN, Vision-Aided, Perceptual | Semantic feature-level quality |
| Temporal | DVD-GAN, TecoGAN, 3D Conv, ConvLSTM | Motion, temporal coherence |
| Frequency | Spectral, SSD-GAN | High-frequency fidelity |
| Audio | MPD, MRD, MSD, MED, UnivHD | Period, resolution, envelope |
| Ensemble | GMAN, MCL-GAN, Dropout-GAN | Multiple perspectives |
| Diversity | Minibatch, PacGAN, Unrolled | Mode coverage |
| Contrastive | ContraD, ContraGAN, Dual Contrastive | Representation-level distinction |
| Augmentation | ADA, DiffAugment | Overfitting prevention |
| Encoder-aware | BiGAN/ALI, BigBiGAN | Joint data-latent coherence |
| 3D geometry | 3D CNN, PointNet, GCN, Graph Transformer | Shape, structure, chemistry |
| Text/sequence | SeqGAN CNN, LM discriminator | Sequence plausibility |
| Fairness | FairGAN, FairGAN+ | Protected attribute debiasing |
| Energy-based | DRS, DDLS | Energy landscape / sampling |
| Domain-specific | CycleGAN dual-D | Domain membership |
| Cooperative | GCC selective activation | Compression equilibrium |
| Distributed | MD-GAN | Federated data quality |

---

## Key Sources

- Goodfellow et al. (2014) -- Original GAN
- Salimans et al. (2016) -- Feature matching, minibatch discrimination
- Isola et al. (2017) -- PatchGAN (pix2pix)
- Arjovsky et al. (2017) -- WGAN
- Gulrajani et al. (2017) -- WGAN-GP
- Miyato et al. (2018) -- Spectral Normalization
- Miyato & Koyama (2018) -- Projection Discriminator
- Karras et al. (2018) -- ProGAN (progressive, minibatch stddev)
- Wang et al. (2018) -- Pix2PixHD (multi-scale)
- Brock et al. (2019) -- BigGAN
- Zhang et al. (2019) -- SAGAN
- Jolicoeur-Martineau (2019) -- Relativistic Discriminator
- Park et al. (2019) -- SPADE
- Karras et al. (2019, 2020) -- StyleGAN, StyleGAN2-ADA
- Schonfeld et al. (2020) -- U-Net Discriminator
- Sauer et al. (2021) -- ProjectedGAN
- Kumari et al. (2022) -- Vision-Aided GAN
- Kong et al. (2020) -- HiFi-GAN (MPD + MSD)
- Jeong & Shin (2021) -- ContraD
- Durugkar et al. (2017) -- GMAN
- Lin et al. (2018) -- PacGAN
- Donahue et al. (2017) -- BiGAN
- Yu et al. (2017) -- SeqGAN
- Cao & Kipf (2018) -- MolGAN
- Xu et al. (2018) -- FairGAN
- Che et al. (2020) -- Energy-based discriminator / DDLS
- Lee et al. (2022) -- ViTGAN
- Jiang et al. (2021) -- TransGAN
